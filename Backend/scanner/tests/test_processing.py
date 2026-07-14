import os
import tempfile
import cv2 as cv
import numpy as np
from django.test import TestCase
from scanner.processing import preprocess, contour, scanner, ocr, pdf_generator, docx_generator, pipeline

class ProcessingPipelineTest(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.fixtures_dir = os.path.join(os.path.dirname(__file__), 'fixtures')
        cls.clean_doc = os.path.join(cls.fixtures_dir, 'clean_document.jpg')
        cls.busy_bg = os.path.join(cls.fixtures_dir, 'busy_background.jpg')
        cls.blank_page = os.path.join(cls.fixtures_dir, 'blank_page.jpg')
        cls.multipage = [
            os.path.join(cls.fixtures_dir, 'multipage', 'page_1.jpg'),
            os.path.join(cls.fixtures_dir, 'multipage', 'page_2.jpg'),
            os.path.join(cls.fixtures_dir, 'multipage', 'page_3.jpg')
        ]

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.output_dir = self.temp_dir.name

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_preprocess_resize_for_detection(self):
        image = cv.imread(self.clean_doc)
        if image is None:
            self.skipTest("clean_document.jpg fixture is missing or invalid.")
        resized, ratio = preprocess.resize_for_detection(image, target_height=500)
        self.assertEqual(resized.shape[0], 500)
        self.assertEqual(ratio, image.shape[0] / 500)

    def test_contour_find_document_contour_clean(self):
        image = cv.imread(self.clean_doc)
        if image is None:
            self.skipTest("clean_document.jpg fixture is missing or invalid.")
        resized, _ = preprocess.resize_for_detection(image)
        gray = preprocess.to_grayscale(resized)
        blurred = preprocess.blur(gray)
        edged = contour.detect_edges(blurred)
        pts = contour.find_document_contour(edged, frame_area=resized.shape[0]*resized.shape[1])
        self.assertIsNotNone(pts)
        self.assertEqual(pts.shape, (4, 2))

    def test_contour_find_document_contour_busy(self):
        image = cv.imread(self.busy_bg)
        if image is None:
            self.skipTest("busy_background.jpg fixture is missing or invalid.")
        resized, _ = preprocess.resize_for_detection(image)
        gray = preprocess.to_grayscale(resized)
        blurred = preprocess.blur(gray)
        edged = contour.detect_edges(blurred)
        pts = contour.find_document_contour(edged, frame_area=resized.shape[0]*resized.shape[1])
        self.assertIsNone(pts)

    def test_scanner_scan_page_clean(self):
        if not os.path.exists(self.clean_doc):
            self.skipTest("clean_document.jpg fixture is missing.")
        result = scanner.scan_page(self.clean_doc, self.output_dir)
        self.assertTrue(result.contour_detected)
        self.assertTrue(os.path.exists(result.scanned_image_path))

    def test_scanner_scan_page_busy(self):
        if not os.path.exists(self.busy_bg):
            self.skipTest("busy_background.jpg fixture is missing.")
        result = scanner.scan_page(self.busy_bg, self.output_dir)
        self.assertFalse(result.contour_detected)
        self.assertTrue(os.path.exists(result.scanned_image_path))
        self.assertTrue(result.scanned_image.size > 0)

    def test_scanner_scan_document_empty(self):
        with self.assertRaises(ValueError):
            scanner.scan_document([], self.output_dir)

    def test_scanner_scan_document_nonexistent(self):
        with self.assertRaises(FileNotFoundError):
            scanner.scan_document(["/nonexistent/file.jpg"], self.output_dir)

    def test_ocr_extract_text_known(self):
        if not os.path.exists(self.clean_doc):
            self.skipTest("clean_document.jpg fixture is missing.")
        result = scanner.scan_page(self.clean_doc, self.output_dir)
        text, conf = ocr.extract_text(result.scanned_image)
        self.assertIn("INVOICE", text.upper())

    def test_ocr_extract_text_blank(self):
        if not os.path.exists(self.blank_page):
            self.skipTest("blank_page.jpg fixture is missing.")
        result = scanner.scan_page(self.blank_page, self.output_dir)
        text, conf = ocr.extract_text(result.scanned_image)
        self.assertTrue(conf < 30)

    def test_ocr_combine_page_texts(self):
        r1 = ocr.PageOCRResult(page_number=1, text="Text 1", confidence=90.0)
        r2 = ocr.PageOCRResult(page_number=2, text="Text 2", confidence=90.0)
        
        single_text = ocr.combine_page_texts([r1])
        self.assertEqual(single_text, "Text 1")
        
        multi_text = ocr.combine_page_texts([r1, r2])
        self.assertIn("--- Page 2 ---", multi_text)
        self.assertIn("Text 1", multi_text)
        self.assertIn("Text 2", multi_text)

    def test_pdf_generator(self):
        pdf_1 = os.path.join(self.output_dir, "doc1.pdf")
        pdf_generator.generate_pdf(["Page 1 content"], pdf_1)
        self.assertTrue(os.path.exists(pdf_1))
        size_1 = os.path.getsize(pdf_1)
        self.assertTrue(size_1 > 0)
        
        pdf_3 = os.path.join(self.output_dir, "doc3.pdf")
        pdf_generator.generate_pdf(["P1", "P2", "P3"], pdf_3)
        size_3 = os.path.getsize(pdf_3)
        self.assertTrue(size_3 > size_1)

    def test_docx_generator(self):
        docx_1 = os.path.join(self.output_dir, "doc1.docx")
        docx_generator.generate_docx(["Page 1 content"], docx_1)
        self.assertTrue(os.path.exists(docx_1))
        size_1 = os.path.getsize(docx_1)
        self.assertTrue(size_1 > 0)
        
        docx_3 = os.path.join(self.output_dir, "doc3.docx")
        docx_generator.generate_docx(["P1", "P2", "P3"], docx_3)
        size_3 = os.path.getsize(docx_3)
        self.assertTrue(size_3 > size_1)

    def test_pipeline_process_document_single(self):
        if not os.path.exists(self.clean_doc):
            self.skipTest("clean_document.jpg fixture is missing.")
        result = pipeline.process_document([self.clean_doc], self.output_dir)
        self.assertIn("pages", result)
        self.assertIn("full_text", result)
        self.assertIn("average_confidence", result)
        self.assertIn("pdf_path", result)
        self.assertIn("docx_path", result)
        self.assertEqual(len(result["pages"]), 1)
        self.assertEqual(result["pages"][0]["page_number"], 1)

    def test_pipeline_process_document_multipage(self):
        for img_path in self.multipage:
            if not os.path.exists(img_path):
                self.skipTest(f"{img_path} fixture is missing.")
        result = pipeline.process_document(self.multipage, self.output_dir)
        self.assertEqual(len(result["pages"]), 3)
        self.assertEqual([p["page_number"] for p in result["pages"]], [1, 2, 3])
        self.assertIn("--- Page 2 ---", result["full_text"])
        self.assertIn("--- Page 3 ---", result["full_text"])
