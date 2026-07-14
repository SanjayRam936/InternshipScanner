import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, PageBreak, Spacer
from reportlab.lib.styles import getSampleStyleSheet

def generate_pdf(page_texts: list[str], output_path: str, title: str | None = None) -> str:
   
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    if title:
        story.append(Paragraph(title, styles['Title']))
        story.append(Spacer(1, 12))

    total_pages = len(page_texts)

    for i, text in enumerate(page_texts):
       
        text_html = text.replace('\n', '<br/>')
        story.append(Paragraph(text_html, styles['Normal']))
        
        if total_pages > 1:
            story.append(Spacer(1, 12))
            story.append(Paragraph(f"Page {i + 1} of {total_pages}", styles['Normal']))
            
            if i < total_pages - 1:
                story.append(PageBreak())

    doc.build(story)
    return output_path
