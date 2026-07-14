import cv2 as cv
import numpy as np
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
fixtures_dir = os.path.join(base_dir, 'fixtures')
multipage_dir = os.path.join(fixtures_dir, 'multipage')

os.makedirs(fixtures_dir, exist_ok=True)
os.makedirs(multipage_dir, exist_ok=True)

# 1. clean_document.jpg - white paper on dark background
img = np.zeros((800, 600, 3), dtype=np.uint8)
cv.rectangle(img, (100, 100), (500, 700), (255, 255, 255), -1)
# Add some text
cv.putText(img, "INVOICE", (150, 150), cv.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
cv.putText(img, "Date: 2026-07-14", (150, 200), cv.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
cv.imwrite(os.path.join(fixtures_dir, 'clean_document.jpg'), img)

# 2. busy_background.jpg - random noise
np.random.seed(42)
img_busy = np.random.randint(0, 256, (800, 600, 3), dtype=np.uint8)
cv.imwrite(os.path.join(fixtures_dir, 'busy_background.jpg'), img_busy)

# 3. blank_page.jpg - pure white
img_blank = np.ones((800, 600, 3), dtype=np.uint8) * 255
cv.imwrite(os.path.join(fixtures_dir, 'blank_page.jpg'), img_blank)

# 4. multipage/page_1.jpg, page_2.jpg, page_3.jpg
img1 = img_blank.copy()
cv.putText(img1, "Page 1", (100, 100), cv.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
cv.imwrite(os.path.join(multipage_dir, 'page_1.jpg'), img1)

img2 = img_blank.copy()
cv.putText(img2, "Page 2", (100, 100), cv.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
cv.imwrite(os.path.join(multipage_dir, 'page_2.jpg'), img2)

img3 = img_blank.copy()
cv.putText(img3, "Page 3", (100, 100), cv.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
cv.imwrite(os.path.join(multipage_dir, 'page_3.jpg'), img3)

print("Fixtures generated.")
