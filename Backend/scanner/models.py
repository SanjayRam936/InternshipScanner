from django.conf import settings

from django.db import models


class Document(models.Model):  
    STATUS_CHOICES = [("uploaded", "Uploaded"),("processing", "Processing"),("completed", "Completed"),("failed", "Failed"),]

    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="documents",)
    title = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="uploaded")
    page_count = models.PositiveIntegerField(default=1)
    language = models.CharField(max_length=10, default="eng")
    full_text = models.TextField(blank=True)
    average_confidence = models.FloatField(null=True, blank=True)
    pdf_file = models.FileField(upload_to="pdf/", null=True, blank=True)
    docx_file = models.FileField(upload_to="docx/", null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-uploaded_at"]
        
    def __str__(self):
        return f"{self.title or 'Document'} ({self.user.username}, {self.page_count}p)"


class Page(models.Model):  
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="pages")
    page_number = models.PositiveIntegerField()
    original_image = models.ImageField(upload_to="uploads/")
    scanned_image = models.ImageField(upload_to="scanned/", null=True, blank=True)
    extracted_text = models.TextField(blank=True)
    confidence = models.FloatField(null=True, blank=True)
    contour_detected = models.BooleanField(default=False)
    detected_corners = models.JSONField(null=True, blank=True) 
    final_corners = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["page_number"]
        unique_together = ("document", "page_number")

    def __str__(self):
        return f"Page {self.page_number} of Document #{self.document_id}"
    