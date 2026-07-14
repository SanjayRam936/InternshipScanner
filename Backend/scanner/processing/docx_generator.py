import os
from docx import Document

def generate_docx(page_texts: list[str], output_path: str, title: str | None = None) -> str:
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = Document()
    
    if title:
        doc.add_heading(title, level=1)
        
    for i, text in enumerate(page_texts):
        if i > 0:
            doc.add_page_break()
            
        for line in text.split('\n'):
            doc.add_paragraph(line)
            
    doc.save(output_path)
    return output_path
