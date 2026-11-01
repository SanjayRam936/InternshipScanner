# Document Scanning Software

A full-stack web application that digitises physical documents using Optical Character Recognition (OCR). Users upload a photo or scan of a document, the app detects and crops the document area, extracts the text, and lets them export the result as PDF or DOCX.

Built during my internship at **CannyMinds Technology Solutions Private Limited, Chennai** (01 June 2026 – 14 July 2026).

---

## Features

- **Secure authentication**: signup and login with JWT access and refresh tokens, protected API routes and protected frontend pages
- **Document upload**: drag-and-drop image upload
- **Automatic document detection**: OpenCV contour and edge detection to find and crop the document
- **Manual correction**: crop and rotate adjustment when automatic detection confidence is low
- **OCR text extraction**: Tesseract OCR with a confidence score for every result
- **Export**: download the extracted text as **PDF** (ReportLab) or **DOCX** (python-docx)
- **Processing history**: each scan is logged with session ID, detected language, confidence score and status
- **Document gallery**: browse previously scanned documents
- **User profile**: account settings page
- **Clean UI**: responsive, monospace-inspired, terminal-style interface

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React (v19), Vite, React Router, Axios, ESLint |
| Backend | Python, Django (v5.2), Django REST Framework |
| Authentication | djangorestframework-simplejwt (JWT) |
| Database | PostgreSQL (psycopg2-binary) |
| Image processing | OpenCV (opencv-contrib-python-headless), Pillow |
| OCR | Tesseract OCR via pytesseract |
| Export | ReportLab (PDF), python-docx (DOCX) |
| Version control | Git and GitHub |

## How It Works

1. The user logs in and receives a JWT access and refresh token pair.
2. A document image is uploaded from the React frontend to the Django REST API.
3. OpenCV detects the document contour, and Pillow applies cropping and rotation correction.
4. pytesseract extracts the text and returns it with a confidence score.
5. The result is stored in PostgreSQL and shown in the history and gallery views.
6. The user can export the extracted text as PDF or DOCX.

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL
- [Tesseract OCR](https://tesseract-ocr.github.io/tessdoc/Installation.html) installed on your system and available on your `PATH`

### 1. Clone the repository

```bash
git clone https://github.com/SanjayRam936/InternshipScanner.git
cd InternshipScanner
```

### 2. Backend setup

> Adjust the folder name (`backend`) if yours is different.

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a PostgreSQL database, then configure your database credentials and secret key (in your `.env` file or `settings.py`, depending on how the project is set up):

```env
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
```

Run the migrations and start the server:

```bash
python manage.py migrate
python manage.py createsuperuser   # optional
python manage.py runserver
```

The API runs at `http://127.0.0.1:8000/`.

### 3. Frontend setup

> Adjust the folder name (`frontend`) if yours is different.

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173/`.

> **Windows note:** if Tesseract is not on your `PATH`, set the path in your code, for example
> `pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"`


## Future Improvements

- Multi-page document scanning
- Batch processing of multiple images
- Advanced OCR language support

## Author

**A. S. Sanjay Ram**
B.E. Computer Science and Engineering, Prathyusha Engineering College

## License

This project was developed as part of an internship. Add a license of your choice here (for example MIT) if you want others to reuse the code.
