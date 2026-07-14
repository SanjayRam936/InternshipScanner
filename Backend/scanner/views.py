from pathlib import Path
from django.conf import settings
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Document, Page
from .serializers import (
    DocumentSerializer, DocumentListSerializer, DocumentUploadSerializer,
    CornersUpdateSerializer,
)
from .processing.pipeline import detect_document, confirm_document


class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "list":
            return DocumentListSerializer
        return DocumentSerializer

    def create(self, request, *args, **kwargs):
        upload_serializer = DocumentUploadSerializer(data=request.data)
        upload_serializer.is_valid(raise_exception=True)
        images = upload_serializer.validated_data["images"]
        title = upload_serializer.validated_data.get("title", "")
        language = upload_serializer.validated_data.get("language", "eng")

        document = Document.objects.create(
            user=request.user,
            title=title,
            language=language,
            status="uploaded",
            page_count=len(images),
        )
        upload_dir = Path(settings.MEDIA_ROOT) / "uploads" / str(document.id)
        upload_dir.mkdir(parents=True, exist_ok=True)
        media_root = Path(settings.MEDIA_ROOT)

        image_paths = []
        for idx, image in enumerate(images, start=1):
            suffix = Path(image.name).suffix or ".jpg"
            saved_path = upload_dir / f"page_{idx}{suffix}"
            with open(saved_path, "wb+") as f:
                for chunk in image.chunks():
                    f.write(chunk)
            image_paths.append(str(saved_path))

        try:
            detect_results = detect_document(image_paths)
        except Exception as exc:
            document.status = "failed"
            document.save(update_fields=["status"])
            return Response({"error": f"Detection failed: {exc}"},
                             status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        for i, det in enumerate(detect_results):
            Page.objects.create(
                document=document,
                page_number=det.page_number,
                original_image=str(Path(image_paths[i]).relative_to(media_root)),
                contour_detected=det.contour_detected,
                detected_corners=det.corners,
            )

        serializer = DocumentSerializer(document, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path="corners")
    def update_corners(self, request, pk=None):
        
        document = self.get_object()
        if document.status not in ("uploaded",):
            return Response({"error": "Corners can only be adjusted before confirming."},
                             status=status.HTTP_400_BAD_REQUEST)

        serializer = CornersUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        for entry in serializer.validated_data["pages"]:
            try:
                page = document.pages.get(page_number=entry["page_number"])
            except Page.DoesNotExist:
                return Response({"error": f"Page {entry['page_number']} not found."},
                                 status=status.HTTP_400_BAD_REQUEST)
            page.final_corners = entry["corners"]
            page.save(update_fields=["final_corners"])

        out = DocumentSerializer(document, context={"request": request})
        return Response(out.data)

    @action(detail=True, methods=["post"], url_path="confirm")
    def confirm(self, request, pk=None):
       
        document = self.get_object()
        if document.status == "completed":
            return Response({"error": "Document already processed."},
                             status=status.HTTP_400_BAD_REQUEST)

        pages = list(document.pages.order_by("page_number"))
        media_root = Path(settings.MEDIA_ROOT)
        image_paths = [str(media_root / p.original_image.name) for p in pages]
        corners_list = [p.final_corners or p.detected_corners for p in pages]

        if any(c is None for c in corners_list):
            return Response({"error": "Missing corners for one or more pages."},
                             status=status.HTTP_400_BAD_REQUEST)

        document.status = "processing"
        document.save(update_fields=["status"])

        output_dir = Path(settings.MEDIA_ROOT) / "scanned" / str(document.id)
        output_dir.mkdir(parents=True, exist_ok=True)

        try:
            result = confirm_document(
                image_paths=image_paths,
                corners_list=corners_list,
                output_dir=str(output_dir),
                title=document.title,
                lang=document.language,
            )
        except Exception as exc:
            document.status = "failed"
            document.save(update_fields=["status"])
            return Response({"error": f"Processing failed: {exc}"},
                             status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        for page, page_data in zip(pages, result["pages"]):
            page.scanned_image = str(Path(page_data["scanned_image_path"]).relative_to(media_root))
            page.extracted_text = page_data["text"]
            page.confidence = page_data["confidence"]
            page.final_corners = page.final_corners or page.detected_corners
            page.save(update_fields=["scanned_image", "extracted_text", "confidence", "final_corners"])

        document.full_text = result["full_text"]
        document.average_confidence = result["average_confidence"]
        document.pdf_file = str(Path(result["pdf_path"]).relative_to(media_root))
        document.docx_file = str(Path(result["docx_path"]).relative_to(media_root))
        document.status = "completed"
        document.save()

        out = DocumentSerializer(document, context={"request": request})
        return Response(out.data)

    @action(detail=False, methods=["get"])
    def search(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response({"detail": "Query parameter 'q' is required."}, status=400)
        results = self.get_queryset().filter(
            Q(title__icontains=query) | Q(full_text__icontains=query)
        )
        serializer = DocumentListSerializer(results, many=True)
        return Response(serializer.data)