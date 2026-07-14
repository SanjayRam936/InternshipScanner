from django.test import TestCase
from django.contrib.auth.models import User
from django.db.utils import IntegrityError
from scanner.models import Document, Page

class DocumentModelTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='password123')
        self.user2 = User.objects.create_user(username='user2', password='password123')

    def test_create_document_defaults(self):
        doc = Document.objects.create(user=self.user1)
        self.assertEqual(doc.status, "uploaded")
        self.assertEqual(doc.page_count, 1)
        self.assertEqual(doc.language, "eng")

    def test_create_page_defaults(self):
        doc = Document.objects.create(user=self.user1)
        page = Page.objects.create(document=doc, page_number=1)
        self.assertFalse(page.contour_detected)

    def test_page_unique_together(self):
        doc = Document.objects.create(user=self.user1)
        Page.objects.create(document=doc, page_number=1)
        with self.assertRaises(IntegrityError):
            Page.objects.create(document=doc, page_number=1)

    def test_document_delete_cascades_pages(self):
        doc = Document.objects.create(user=self.user1)
        Page.objects.create(document=doc, page_number=1)
        Page.objects.create(document=doc, page_number=2)
        
        self.assertEqual(Page.objects.count(), 2)
        doc.delete()
        self.assertEqual(Page.objects.count(), 0)

    def test_document_pages_ordering(self):
        doc = Document.objects.create(user=self.user1)
        Page.objects.create(document=doc, page_number=3)
        Page.objects.create(document=doc, page_number=1)
        Page.objects.create(document=doc, page_number=2)
        
        pages = list(doc.pages.all())
        self.assertEqual([p.page_number for p in pages], [1, 2, 3])

    def test_str_methods(self):
        doc = Document.objects.create(user=self.user1)
        page = Page.objects.create(document=doc, page_number=1)
        self.assertTrue(str(doc))
        self.assertTrue(str(page))

    def test_user_queryset_isolation(self):
        doc1 = Document.objects.create(user=self.user1)
        doc2 = Document.objects.create(user=self.user2)
        
        user1_docs = Document.objects.filter(user=self.user1)
        self.assertIn(doc1, user1_docs)
        self.assertNotIn(doc2, user1_docs)
