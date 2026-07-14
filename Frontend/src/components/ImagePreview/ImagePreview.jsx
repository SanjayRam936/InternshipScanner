import { useRef, useEffect } from 'react';
import './ImagePreview.css';

/**
 * Shows an uploaded image with an SVG overlay tracing the detected corners.
 * corners: array of 4 [x, y] in natural image coordinates.
 */
const ImagePreview = ({ imageUrl, corners, label = 'OPTICAL_PREVIEW_Z1', contourDetected = true }) => {
  const imgRef = useRef(null);
  const svgRef = useRef(null);

  const updateOverlay = () => {
    const img = imgRef.current;
    const svg = svgRef.current;
    if (!img || !svg || !corners) return;

    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    if (!naturalWidth || !naturalHeight) return;

    const scaleX = clientWidth / naturalWidth;
    const scaleY = clientHeight / naturalHeight;

    const scaledPoints = corners
      .map(([x, y]) => `${x * scaleX},${y * scaleY}`)
      .join(' ');

    svg.style.width = `${clientWidth}px`;
    svg.style.height = `${clientHeight}px`;

    const polygon = svg.querySelector('.preview-polygon');
    if (polygon) polygon.setAttribute('points', scaledPoints);

    const circles = svg.querySelectorAll('.preview-handle');
    circles.forEach((c, i) => {
      const [x, y] = corners[i];
      c.setAttribute('cx', x * scaleX);
      c.setAttribute('cy', y * scaleY);
    });
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    img.addEventListener('load', updateOverlay);
    window.addEventListener('resize', updateOverlay);
    return () => {
      img.removeEventListener('load', updateOverlay);
      window.removeEventListener('resize', updateOverlay);
    };
  }, [corners]);

  useEffect(() => {
    updateOverlay();
  }, [corners]);

  return (
    <div className="image-preview bracket-box">
      <div className="bracket-box-inner">
        <div className="image-preview-header">
          <span className="font-mono text-xs text-upper text-muted">{label}</span>
          {contourDetected !== null && (
            <span className={`tag ${contourDetected ? 'tag-green' : 'tag-muted'}`}>
              {contourDetected ? '✓ DOC_DETECTED' : '○ FALLBACK_USED'}
            </span>
          )}
        </div>

        <div className="image-preview-frame" id="image-preview-frame">
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Document preview"
            className="image-preview-img"
            onLoad={updateOverlay}
          />
          {corners && (
            <svg
              ref={svgRef}
              className="image-preview-overlay"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon
                className="preview-polygon"
                points=""
                fill="rgba(179,49,44,0.12)"
                stroke="#B3312C"
                strokeWidth="2"
              />
              {corners.map((_, i) => (
                <circle
                  key={i}
                  className="preview-handle"
                  cx="0" cy="0" r="5"
                  fill="#B3312C"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
