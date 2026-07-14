import cv2 as cv
import numpy as np


def resize_for_detection(image: np.ndarray, target_height: int = 500) -> tuple[np.ndarray, float]:

    h = image.shape[0]
    ratio = h / target_height
    target_width = int(image.shape[1] / ratio)
    resized_image = cv.resize(image, (target_width, target_height))
    return resized_image, ratio


def to_grayscale(image: np.ndarray) -> np.ndarray:
    return cv.cvtColor(image, cv.COLOR_BGR2GRAY)


def blur(image: np.ndarray, ksize: tuple[int, int] = (5, 5)) -> np.ndarray:
    return cv.GaussianBlur(image, ksize, 0)


def enhance_contrast(gray: np.ndarray, clip_limit: float = 2.0, tile_grid_size: tuple[int, int] = (8, 8)) -> np.ndarray:

    clahe = cv.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    return clahe.apply(gray)


def upscale_for_ocr(gray: np.ndarray, scale: float = 2.0) -> np.ndarray:

    return cv.resize(gray, None, fx=scale, fy=scale, interpolation=cv.INTER_CUBIC)


def denoise(gray: np.ndarray, h: int = 10) -> np.ndarray:

    return cv.fastNlMeansDenoising(gray, h=h)


def adaptive_threshold(image: np.ndarray, block_size: int = 25, c: int = 15) -> np.ndarray:

    if len(image.shape) == 3:
        image = to_grayscale(image)
    return cv.adaptiveThreshold(
        image, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, block_size, c
    )


def compute_skew_angle(gray: np.ndarray, max_angle: float = 15.0) -> float:
   
    thresh = cv.threshold(gray, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU)[1]
    coords = np.column_stack(np.where(thresh > 0))

    if coords.shape[0] < 10:
        return 0.0

    angle = cv.minAreaRect(coords)[-1]

    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    if abs(angle) > max_angle:
        return 0.0

    return angle


def deskew(image: np.ndarray, angle: float | None = None) -> np.ndarray:
    
    if angle is None:
        gray = to_grayscale(image) if len(image.shape) == 3 else image
        angle = compute_skew_angle(gray)

    if abs(angle) < 0.3:
        return image

    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)

    M = cv.getRotationMatrix2D(center, angle, 1.0)

    cos = abs(M[0, 0])
    sin = abs(M[0, 1])
    new_w = int((h * sin) + (w * cos))
    new_h = int((h * cos) + (w * sin))

    M[0, 2] += (new_w / 2) - center[0]
    M[1, 2] += (new_h / 2) - center[1]

    border_value = 255 if len(image.shape) == 2 else (255, 255, 255)

    return cv.warpAffine(
        image, M, (new_w, new_h),
        flags=cv.INTER_CUBIC,
        borderMode=cv.BORDER_CONSTANT,
        borderValue=border_value,
    )


def rotate_90(image: np.ndarray, times: int = 1) -> np.ndarray:
    
    times = times % 4
    if times == 0:
        return image
    if times == 1:
        return cv.rotate(image, cv.ROTATE_90_CLOCKWISE)
    if times == 2:
        return cv.rotate(image, cv.ROTATE_180)
    return cv.rotate(image, cv.ROTATE_90_COUNTERCLOCKWISE)


def remove_box_shapes(
    gray: np.ndarray,
    min_size_ratio: float = 0.008,
    max_size_ratio: float = 0.05,
    min_aspect: float = 0.4,
    max_aspect: float = 3.0,
    max_corner_points: int = 6,
    min_hole_size_ratio: float = 0.15,
    padding: int = 3,
    debug: bool = False,
) -> np.ndarray:
    
    cleaned = gray.copy()
    h_img, w_img = gray.shape[:2]
    min_dim = min(h_img, w_img)

    min_size = max(3, int(min_dim * min_size_ratio))
    max_size = int(min_dim * max_size_ratio)

    thresh = cv.threshold(gray, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU)[1]
    contours, hierarchy = cv.findContours(thresh, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE)

    removed_count = 0

    if hierarchy is None or len(contours) == 0:
        return cleaned

    hierarchy = hierarchy[0]

    for i, c in enumerate(contours):
        next_, prev_, first_child, parent = hierarchy[i]

        if parent != -1:
            continue  

        if first_child == -1:
            continue  

        x, y, w, h = cv.boundingRect(c)

        size_ok = min_size <= w <= max_size and min_size <= h <= max_size
        if not size_ok:
            continue

        aspect = w / float(h)
        if aspect < min_aspect or aspect > max_aspect:
            continue

        outer_peri = cv.arcLength(c, True)
        outer_approx = cv.approxPolyDP(c, 0.03 * outer_peri, True)
        outer_is_rect = len(outer_approx) <= max_corner_points

        hole_contour = contours[first_child]
        hole_peri = cv.arcLength(hole_contour, True)
        hole_approx = cv.approxPolyDP(hole_contour, 0.03 * hole_peri, True)
        hole_is_rect = len(hole_approx) <= max_corner_points

        outer_area = cv.contourArea(c)
        hole_area = cv.contourArea(hole_contour)
        hole_size_ratio = (hole_area / outer_area) if outer_area > 0 else 0.0
        hole_big_enough = hole_size_ratio > min_hole_size_ratio

        is_box_like = outer_is_rect and hole_is_rect and hole_big_enough

        if debug:
            print(
                f"[candidate] w={w} h={h} aspect={aspect:.2f} "
                f"outer_corners={len(outer_approx)} hole_corners={len(hole_approx)} "
                f"hole_size_ratio={hole_size_ratio:.2f} "
                f"-> {'REMOVE' if is_box_like else 'keep'}"
            )

        if is_box_like:
            x0 = max(0, x - padding)
            y0 = max(0, y - padding)
            x1 = min(cleaned.shape[1], x + w + padding)
            y1 = min(cleaned.shape[0], y + h + padding)
            cleaned[y0:y1, x0:x1] = 255
            removed_count += 1

    if debug:
        print(f"[remove_box_shapes] image={w_img}x{h_img} min_dim={min_dim} "
              f"size_range=({min_size},{max_size}) removed={removed_count}")

    return cleaned


def prepare_for_ocr(image: np.ndarray, debug_box_removal: bool = False) -> np.ndarray:

    if len(image.shape) == 3:
        gray = to_grayscale(image)
    else:
        gray = image
    enhanced = enhance_contrast(gray)
    upscaled = upscale_for_ocr(enhanced)
    denoised = denoise(upscaled)
    shapes_removed = remove_box_shapes(denoised, debug=debug_box_removal)
    return adaptive_threshold(shapes_removed)