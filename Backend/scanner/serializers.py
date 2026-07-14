from rest_framework import serializers
from .models import Document, Page


class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = [
            "id", "page_number", "original_image", "scanned_image",
            "extracted_text", "confidence", "contour_detected",
            "detected_corners", "final_corners",
            "created_at",
        ]
        read_only_fields = fields


class DocumentSerializer(serializers.ModelSerializer):
    pages = PageSerializer(many=True, read_only=True)

    class Meta:
        model = Document
        fields = [
            "id", "title", "status", "page_count", "language",
            "full_text", "average_confidence", "pdf_file", "docx_file",
            "uploaded_at", "updated_at", "pages",
        ]
        read_only_fields = [
            "status", "page_count", "full_text", "average_confidence",
            "pdf_file", "docx_file", "uploaded_at", "updated_at", "pages",
        ]


class DocumentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["id", "title", "status", "page_count", "average_confidence", "uploaded_at"]
        read_only_fields = fields


class DocumentUploadSerializer(serializers.Serializer):
    images = serializers.ListField(
        child=serializers.ImageField(), allow_empty=False, min_length=1, max_length=30,
    )
    title = serializers.CharField(required=False, allow_blank=True, max_length=255)
    language = serializers.CharField(required=False, default="eng", max_length=10)


class CornerPointsField(serializers.ListField):
    child = serializers.ListField(child=serializers.FloatField(), min_length=2, max_length=2)
    min_length = 4
    max_length = 4


class CornersUpdateSerializer(serializers.Serializer):
    pages = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate_pages(self, value):
        for entry in value:
            if "page_number" not in entry or "corners" not in entry:
                raise serializers.ValidationError("Each entry needs page_number and corners.")
            corners = entry["corners"]
            if not (isinstance(corners, list) and len(corners) == 4
                    and all(isinstance(pt, list) and len(pt) == 2 for pt in corners)):
                raise serializers.ValidationError("corners must be a list of 4 [x, y] pairs.")
        return value