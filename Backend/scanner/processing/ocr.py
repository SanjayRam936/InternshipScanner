import pytesseract
import numpy as np
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .scanner import PageScanResult

TESSERACT_CONFIG = "--psm 6"

@dataclass
class PageOCRResult:
    page_number: int
    text: str
    confidence: float

def extract_text(scanned_image: np.ndarray, lang: str = "eng") -> tuple[str, float]:
    """Run pytesseract.image_to_string AND image_to_data (for confidence) on one image."""
    try:
        text = pytesseract.image_to_string(scanned_image, lang=lang, config=TESSERACT_CONFIG).strip()
        data = pytesseract.image_to_data(
            scanned_image, lang=lang, config=TESSERACT_CONFIG, output_type=pytesseract.Output.DICT
        )

        confidences = [int(conf) for conf in data['conf'] if int(conf) != -1]
        confidence = sum(confidences) / len(confidences) if confidences else 0.0
        return text, confidence
    except Exception as e:
        print(f"OCR failed: {e}")
        return "", 0.0

def run_ocr_on_pages(page_results: list["PageScanResult"], lang: str = "eng") -> list[PageOCRResult]:
    """Runs extract_text() on every page's scanned_image, in order."""
    ocr_results = []
    for page in page_results:
        text, conf = extract_text(page.scanned_image, lang=lang)
        ocr_results.append(PageOCRResult(
            page_number=page.page_number,
            text=text,
            confidence=conf
        ))
    return ocr_results

def combine_page_texts(ocr_results: list[PageOCRResult]) -> str:
    """Join all page texts into one document string."""
    if len(ocr_results) == 1:
        return ocr_results[0].text

    parts = []
    for r in ocr_results:
        parts.append(f"--- Page {r.page_number} ---\n\n{r.text}")
    return "\n\n".join(parts)

def average_confidence(ocr_results: list[PageOCRResult]) -> float:
    
    if not ocr_results:
        return 0.0
    return sum(r.confidence for r in ocr_results) / len(ocr_results)