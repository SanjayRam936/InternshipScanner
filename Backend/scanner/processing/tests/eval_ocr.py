import os
import sys
import difflib
import time
import cv2 as cv
import numpy as np


# Add backend dir to path to import scanner
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from scanner.processing.scanner import PageScanResult
from scanner.processing.ocr import run_ocr_on_pages, combine_page_texts, average_confidence
from scanner.processing.preprocess import prepare_for_ocr

FIXTURES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../tests/fixtures"))

def compute_similarity(actual: str, expected: str) -> float:
    # Use difflib to compute similarity ratio (0.0 to 1.0)
    # Convert to lowercase and strip whitespace for fairer comparison
    a = " ".join(actual.lower().split())
    e = " ".join(expected.lower().split())
    if not e:
        return 0.0 if a else 1.0
    return difflib.SequenceMatcher(None, a, e).ratio()

def evaluate():
    print(f"Loading fixtures from {FIXTURES_DIR}")
    
    # Find all jpg files in fixtures dir (excluding multipage for now)
    sample_images = [f for f in os.listdir(FIXTURES_DIR) if f.endswith(".jpg")]
    
    if not sample_images:
        print("No sample images found!")
        return
        
    results = []
    
    for filename in sample_images:
        image_path = os.path.join(FIXTURES_DIR, filename)
        gt_path = os.path.join(FIXTURES_DIR, filename.replace(".jpg", ".txt"))
        
        expected_text = ""
        if os.path.exists(gt_path):
            with open(gt_path, "r", encoding="utf-8") as f:
                expected_text = f.read()
        else:
            print(f"Warning: No ground truth file found for {filename}. Similarity will be 0.")
            
        print(f"Processing {filename}...")
        
        # Read image directly, assuming no transform needed for these tests, just pure OCR prep
        image = cv.imread(image_path)
        if image is None:
            print(f"Failed to read {filename}")
            continue
            
        start_time = time.time()
        
        # Run standard preprocessing
        prepared_image = prepare_for_ocr(image)
        
        # Mock PageScanResult
        page_result = PageScanResult(
            page_number=1,
            scanned_image=prepared_image,
            contour_detected=False,
            original_path=image_path,
            scanned_image_path="dummy"
        )
        
        # Run OCR
        ocr_results = run_ocr_on_pages([page_result])
        final_text = combine_page_texts(ocr_results)
        avg_conf = average_confidence(ocr_results)
        
        elapsed = time.time() - start_time
        
        # Calculate stats
        word_count = len(final_text.split())
        similarity = compute_similarity(final_text, expected_text)
        
        results.append([
            filename,
            f"{avg_conf:.1f}%",
            word_count,
            f"{similarity:.2%}",
            f"{elapsed:.2f}s"
        ])
    
    # Print summary table
    print("\n" + "="*60)
    print("OCR EVALUATION SUMMARY")
    print("="*60)
    try:
        from tabulate import tabulate
        headers = ["Image", "Avg Confidence", "Word Count", "Similarity (GT)", "Time"]
        print(tabulate(results, headers=headers, tablefmt="grid"))
    except ImportError:
        print(f"{'Image':<20} | {'Avg Confidence':<15} | {'Word Count':<10} | {'Similarity':<12} | {'Time'}")
        print("-" * 75)
        for r in results:
            print(f"{r[0]:<20} | {r[1]:<15} | {r[2]:<10} | {r[3]:<12} | {r[4]}")
            
    
    # Calculate averages
    avg_similarity = sum(float(r[3].strip('%')) for r in results) / len(results) if results else 0
    avg_conf = sum(float(r[1].strip('%')) for r in results) / len(results) if results else 0
    
    print(f"\nAverage Confidence: {avg_conf:.1f}%")
    print(f"Average Similarity: {avg_similarity:.2f}%")
    print("="*60 + "\n")

if __name__ == "__main__":
    evaluate()
