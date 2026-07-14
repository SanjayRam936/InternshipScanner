import os
import cv2 as cv
import numpy as np
from dataclasses import dataclass
from .preprocess import resize_for_detection, to_grayscale, blur, prepare_for_ocr, deskew, rotate_90
from .contour import detect_edges, find_document_contour, four_point_transform


@dataclass
class PageDetectResult:
    page_number: int
    original_path: str
    corners: list
    contour_detected: bool
    image_width: int
    image_height: int


@dataclass
class PageScanResult:
    page_number: int
    scanned_image: np.ndarray
    contour_detected: bool
    original_path: str
    scanned_image_path: str


def _full_frame_corners(image: np.ndarray) -> list:
    h, w = image.shape[:2]
    return [[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]]


def detect_page_corners(image_path: str, page_number: int = 1) -> PageDetectResult:

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at {image_path}")

    image = cv.imread(image_path)
    if image is None:
        raise ValueError(f"Failed to read image at {image_path}")

    h, w = image.shape[:2]
    resized, ratio = resize_for_detection(image)
    gray = to_grayscale(resized)
    blurred = blur(gray)
    edged = detect_edges(blurred)

    frame_area = resized.shape[0] * resized.shape[1]
    contour = find_document_contour(edged, frame_area=frame_area)

    if contour is not None:
        full_res_corners = (contour * ratio).tolist()
        contour_detected = True
    else:
        full_res_corners = _full_frame_corners(image)
        contour_detected = False

    return PageDetectResult(
        page_number=page_number,
        original_path=image_path,
        corners=full_res_corners,
        contour_detected=contour_detected,
        image_width=w,
        image_height=h,
    )


def detect_document_corners(image_paths: list[str]) -> list[PageDetectResult]:
    if not image_paths:
        raise ValueError("image_paths list cannot be empty")
    if len(image_paths) > 30:
        raise ValueError(f"Exceeded maximum pages. Max is 30, got {len(image_paths)}")

    return [detect_page_corners(p, page_number=i + 1) for i, p in enumerate(image_paths)]


def apply_page_transform(
    image_path: str,
    corners: list,
    output_dir: str,
    page_number: int = 1,
    rotation: int = 0,
) -> PageScanResult:
 
    image = cv.imread(image_path)
    if image is None:
        raise ValueError(f"Failed to read image at {image_path}")

    if rotation:
        image = rotate_90(image, times=rotation)

    pts = np.array(corners, dtype="float32")
    warped = four_point_transform(image, pts)
    deskewed = deskew(warped)

    final_image = prepare_for_ocr(deskewed)

    os.makedirs(output_dir, exist_ok=True)
    scanned_image_path = os.path.join(output_dir, f"page_{page_number}.jpg")
    cv.imwrite(scanned_image_path, final_image)

    return PageScanResult(
        page_number=page_number,
        scanned_image=final_image,
        contour_detected=True,
        original_path=image_path,
        scanned_image_path=scanned_image_path,
    )


def apply_document_transform(
    image_paths: list[str],
    corners_list: list[list],
    output_dir: str,
    rotations: list[int] | None = None,
) -> list[PageScanResult]:
   
    if rotations is None:
        rotations = [0] * len(image_paths)

    results = []
    for i, (path, corners) in enumerate(zip(image_paths, corners_list)):
        results.append(
            apply_page_transform(
                path, corners, output_dir,
                page_number=i + 1,
                rotation=rotations[i] if i < len(rotations) else 0,
            )
        )
    return results