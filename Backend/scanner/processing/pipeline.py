import os
from .scanner import detect_document_corners, apply_document_transform
from .ocr import run_ocr_on_pages, combine_page_texts, average_confidence
from .pdf_generator import generate_pdf
from .docx_generator import generate_docx


def detect_document(image_paths: list[str]) -> list:
    """Fast, OCR-free. Called from POST /documents/."""
    return detect_document_corners(image_paths)


def confirm_document(
    image_paths: list[str],
    corners_list: list[list],
    output_dir: str,
    title: str | None = None,
    lang: str = "eng",
    rotations: list[int] | None = None,
) -> dict:
   
    scan_results = apply_document_transform(image_paths, corners_list, output_dir, rotations=rotations)
    ocr_results = run_ocr_on_pages(scan_results, lang=lang)
    full_text = combine_page_texts(ocr_results)
    avg_conf = average_confidence(ocr_results)

    pdf_path = os.path.join(output_dir, "document.pdf")
    generate_pdf([r.text for r in ocr_results], pdf_path, title=title)

    docx_path = os.path.join(output_dir, "document.docx")
    generate_docx([r.text for r in ocr_results], docx_path, title=title)

    pages = []
    for s_res, o_res in zip(scan_results, ocr_results):
        pages.append({
            "page_number": s_res.page_number,
            "scanned_image_path": s_res.scanned_image_path,
            "text": o_res.text,
            "confidence": o_res.confidence,
        })

    return {
        "pages": pages,
        "full_text": full_text,
        "average_confidence": avg_conf,
        "pdf_path": pdf_path,
        "docx_path": docx_path,
    }