import os
from unittest.mock import patch
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from scanner.models import Document, Page

class DocumentViewTests(APITestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.fixtures_dir = os.path.join(os.path.dirname(__file__), 'fixtures')
        cls.clean_doc = os.path.join(cls.fixtures_dir, 'clean_document.jpg')

    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='password123')
        self.user2 = User.objects.create_user(username='user2', password='password123')
        
        # Ensure the file exists or create a dummy for the test
        if not os.path.exists(self.clean_doc):
            os.makedirs(self.fixtures_dir, exist_ok=True)
            with open(self.clean_doc, 'wb') as f:
                f.write(b'dummy image data')

    def test_get_documents_unauthenticated(self):
        response = self.client.get('/api/documents/')
        self.assertEqual(response.status_code, 401)

    def test_get_documents_authenticated_empty(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/documents/')
        self.assertEqual(response.status_code, 200)
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(data, [])

    @patch('scanner.views.process_document')
    def test_upload_single_image(self, mock_process):
        def fake_process_document(image_paths, output_dir, title=None, lang="eng"):
            return {
                "pages": [
                    {
                        "page_number": 1,
                        "scanned_image_path": f"{output_dir}/page_1.jpg",
                        "text": "test",
                        "confidence": 90.0,
                        "contour_detected": True,
                    }
                ],
                "full_text": "test",
                "average_confidence": 90.0,
                "pdf_path": f"{output_dir}/document.pdf",
                "docx_path": f"{output_dir}/document.docx",
            }
        mock_process.side_effect = fake_process_document
        self.client.force_authenticate(user=self.user1)
        with open(self.clean_doc, 'rb') as f:
            file_data = SimpleUploadedFile("clean_document.jpg", f.read(), content_type="image/jpeg")
            
        response = self.client.post('/api/documents/', {'images': [file_data]}, format='multipart')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data.get('status'), "completed")
        self.assertEqual(response.data.get('page_count'), 1)
        self.assertEqual(len(response.data.get('pages', [])), 1)

    @patch('scanner.views.process_document')
    def test_upload_multiple_images(self, mock_process):
        def fake_process_document(image_paths, output_dir, title=None, lang="eng"):
            return {
                "pages": [
                    {
                        "page_number": i + 1,
                        "scanned_image_path": f"{output_dir}/page_{i+1}.jpg",
                        "text": f"test {i+1}",
                        "confidence": 90.0,
                        "contour_detected": True,
                    }
                    for i in range(len(image_paths))
                ],
                "full_text": "test",
                "average_confidence": 90.0,
                "pdf_path": f"{output_dir}/document.pdf",
                "docx_path": f"{output_dir}/document.docx",
            }
        mock_process.side_effect = fake_process_document
        self.client.force_authenticate(user=self.user1)
        with open(self.clean_doc, 'rb') as f:
            file_data1 = SimpleUploadedFile("doc1.jpg", f.read(), content_type="image/jpeg")
        with open(self.clean_doc, 'rb') as f:
            file_data2 = SimpleUploadedFile("doc2.jpg", f.read(), content_type="image/jpeg")
            
        response = self.client.post('/api/documents/', {'images': [file_data1, file_data2]}, format='multipart')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data.get('page_count'), 2)
        self.assertEqual(len(response.data.get('pages', [])), 2)
        self.assertEqual(response.data['pages'][0]['page_number'], 1)
        self.assertEqual(response.data['pages'][1]['page_number'], 2)

    def test_upload_no_images(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post('/api/documents/', {}, format='multipart')
        self.assertEqual(response.status_code, 400)

    @patch('scanner.views.process_document')
    def test_upload_processing_fails(self, mock_process):
        mock_process.side_effect = Exception("Simulated processing error")
        self.client.force_authenticate(user=self.user1)
        with open(self.clean_doc, 'rb') as f:
            file_data = SimpleUploadedFile("clean_document.jpg", f.read(), content_type="image/jpeg")
            
        response = self.client.post('/api/documents/', {'images': [file_data]}, format='multipart')
        self.assertEqual(response.status_code, 422)
        
        doc = Document.objects.filter(user=self.user1).first()
        self.assertIsNotNone(doc)
        self.assertEqual(doc.status, "failed")

    def test_data_isolation(self):
        doc1 = Document.objects.create(user=self.user1, title="User1 Doc")
        doc2 = Document.objects.create(user=self.user2, title="User2 Doc")
        
        self.client.force_authenticate(user=self.user2)
        response = self.client.get('/api/documents/')
        
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        titles = [d.get('title') for d in data]
        
        self.assertIn("User2 Doc", titles)
        self.assertNotIn("User1 Doc", titles)
        
        response_detail = self.client.get(f'/api/documents/{doc1.id}/')
        self.assertEqual(response_detail.status_code, 404)

    def test_search_no_q(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/documents/search/')
        self.assertEqual(response.status_code, 400)

    def test_search_with_q(self):
        doc1 = Document.objects.create(user=self.user1, title="Invoice 123", full_text="Some text")
        doc2 = Document.objects.create(user=self.user1, title="Other", full_text="Other text")
        
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/documents/search/?q=invoice')
        self.assertEqual(response.status_code, 200)
        
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        ids = [d.get('id') for d in data]
        self.assertIn(doc1.id, ids)
        self.assertNotIn(doc2.id, ids)

    def test_delete_own_document(self):
        doc1 = Document.objects.create(user=self.user1, title="User1 Doc")
        self.client.force_authenticate(user=self.user1)
        response = self.client.delete(f'/api/documents/{doc1.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Document.objects.filter(id=doc1.id).exists())

    def test_delete_other_user_document(self):
        doc2 = Document.objects.create(user=self.user2, title="User2 Doc")
        self.client.force_authenticate(user=self.user1)
        response = self.client.delete(f'/api/documents/{doc2.id}/')
        self.assertEqual(response.status_code, 404)
        self.assertTrue(Document.objects.filter(id=doc2.id).exists())
