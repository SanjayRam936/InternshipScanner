import os
import random
from PIL import Image, ImageDraw, ImageFont

base_dir = os.path.dirname(os.path.abspath(__file__))
multipage_dir = os.path.join(base_dir, 'multipage')

os.makedirs(multipage_dir, exist_ok=True)

try:
    font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 40)
except IOError:
    font = ImageFont.load_default()

def make_clean_document():
    # 800x1000 dark gray background
    img = Image.new('RGB', (800, 1000), color=(50, 50, 50))
    draw = ImageDraw.Draw(img)
    # White rectangle in the middle
    draw.rectangle([100, 100, 700, 900], fill=(255, 255, 255))
    # Add text
    draw.text((150, 150), "INVOICE #1234", fill=(0, 0, 0), font=font)
    draw.text((150, 220), "Date: 2026-07-14", fill=(0, 0, 0), font=font)
    draw.text((150, 290), "Total: $100.00", fill=(0, 0, 0), font=font)
    img.save(os.path.join(base_dir, 'clean_document.jpg'), "JPEG", quality=90)

def make_busy_background():
    img = Image.new('RGB', (800, 1000), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    # Random speckle / shapes
    for _ in range(500):
        x1 = random.randint(0, 800)
        y1 = random.randint(0, 1000)
        x2 = x1 + random.randint(10, 50)
        y2 = y1 + random.randint(10, 50)
        color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        draw.rectangle([x1, y1, x2, y2], fill=color)
    img.save(os.path.join(base_dir, 'busy_background.jpg'), "JPEG", quality=90)

def make_blank_page():
    img = Image.new('RGB', (800, 1000), color=(255, 255, 255))
    img.save(os.path.join(base_dir, 'blank_page.jpg'), "JPEG", quality=90)

def make_multipage():
    texts = ["PAGE ONE", "PAGE TWO", "PAGE THREE"]
    for i, text in enumerate(texts):
        img = Image.new('RGB', (800, 1000), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        draw.text((200, 400), text, fill=(0, 0, 0), font=font)
        img.save(os.path.join(multipage_dir, f'page_{i+1}.jpg'), "JPEG", quality=90)

if __name__ == "__main__":
    make_clean_document()
    make_busy_background()
    make_blank_page()
    make_multipage()
    print("Fixtures generated successfully.")
