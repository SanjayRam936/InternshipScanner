import pytesseract
import numpy as np
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .scanner import PageScanResult

from .preprocess import binarize_for_fallback

@dataclass
class PageOCRResult:
    page_number: int
    text: str
    confidence: float

def run_single_pass(scanned_image: np.ndarray, config: str, lang: str = "eng") -> tuple[str, float]:
    """Runs a single OCR pass and returns text and confidence, filtering out low-confidence words."""
    try:
        data = pytesseract.image_to_data(
            scanned_image, lang=lang, config=config, output_type=pytesseract.Output.DICT
        )
        
        lines = []
        current_line = []
        confidences = []
        dropped_count = 0
        total_valid_words = 0
        
        for i in range(len(data['text'])):
            if int(data['conf'][i]) != -1 and data['text'][i].strip():
                total_valid_words += 1
                if int(data['conf'][i]) < 35:
                    dropped_count += 1
                    
        drop_words = False
        if total_valid_words > 0 and (dropped_count / total_valid_words) <= 0.15:
            drop_words = True
            
        last_id = (-1, -1, -1)
        
        for i in range(len(data['text'])):
            word = data['text'][i]
            conf = int(data['conf'][i])
            b, p, l = data['block_num'][i], data['par_num'][i], data['line_num'][i]
            
            if conf != -1 and word.strip():
                if last_id != (-1, -1, -1) and (b, p, l) != last_id:
                    if current_line:
                        lines.append(" ".join(current_line))
                        current_line = []
                        
                last_id = (b, p, l)
                
                if drop_words and conf < 35:
                    continue
                    
                current_line.append(word)
                confidences.append(conf)
                
        if current_line:
            lines.append(" ".join(current_line))
            
        text = "\n".join(lines).strip()
        confidence = sum(confidences) / len(confidences) if confidences else 0.0
        return text, confidence
    except Exception as e:
        print(f"OCR failed: {e}")
        return "", 0.0

def extract_text(scanned_image: np.ndarray, lang: str = "eng") -> tuple[str, float]:
    """Run multi-pass OCR strategy."""
    best_text = ""
    best_conf = -1.0
    
    import os
    tessdata_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../tessdata"))
    if os.path.exists(tessdata_dir):
        os.environ["TESSDATA_PREFIX"] = tessdata_dir
    
    text_a, conf_a = run_single_pass(scanned_image, config="--psm 6 --oem 1", lang=lang)
    if conf_a > best_conf:
        best_text, best_conf = text_a, conf_a
        
    text_b, conf_b = run_single_pass(scanned_image, config="--psm 3 --oem 1", lang=lang)
    if conf_b > best_conf:
        best_text, best_conf = text_b, conf_b
        
    fallback_image = binarize_for_fallback(scanned_image)
    text_c, conf_c = run_single_pass(fallback_image, config="--psm 6 --oem 1", lang=lang)
    if conf_c > best_conf:
        best_text, best_conf = text_c, conf_c
        
    return best_text, max(best_conf, 0.0)

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