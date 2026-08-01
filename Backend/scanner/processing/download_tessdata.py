import os
import urllib.request

TESSDATA_URL = "https://github.com/tesseract-ocr/tessdata_best/raw/main/eng.traineddata"
TESSDATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../tessdata"))

if __name__ == "__main__":
    os.makedirs(TESSDATA_DIR, exist_ok=True)
    target_path = os.path.join(TESSDATA_DIR, "eng.traineddata")
    if not os.path.exists(target_path):
        print(f"Downloading {TESSDATA_URL} to {target_path}...")
        try:
            urllib.request.urlretrieve(TESSDATA_URL, target_path)
            print("Download completed successfully.")
        except Exception as e:
            print(f"Download failed: {e}")
    else:
        print(f"File already exists at {target_path}")
