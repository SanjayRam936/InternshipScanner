import { useRef, useState, useEffect, useCallback } from 'react';
import './CornerAdjuster.css';

/**
 * 4-point draggable corner adjuster overlay.
 * Props:
 *   imageUrl           - URL of the document image
 *   initialCorners     - [[x,y]x4] in natural image pixel coordinates
 *   imageNaturalWidth  - natural pixel width
 *   imageNaturalHeight - natural pixel height
 *   onChange(corners)  - called on drag end with updated natural-coordinate corners
 */
const CornerAdjuster = ({
  imageUrl,
  initialCorners,
  imageNaturalWidth,
  imageNaturalHeight,
  onChange,
}) => {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [corners, setCorners] = useState(initialCorners || [[0,0],[100,0],[100,100],[0,100]]);
  const draggingIndex = useRef(null);

  /* ---- Compute scale factors ---- */
  const getScale = useCallback(() => {
    if (!displaySize.w || !imageNaturalWidth) return { sx: 1, sy: 1 };
    return {
      sx: displaySize.w / imageNaturalWidth,
      sy: displaySize.h / imageNaturalHeight,
    };
  }, [displaySize, imageNaturalWidth, imageNaturalHeight]);

  /* ---- Displayed coordinates ---- */
  const toDisplay = ([x, y]) => {
    const { sx, sy } = getScale();
    return [x * sx, y * sy];
  };

  const toNatural = ([dx, dy]) => {
    const { sx, sy } = getScale();
    return [
      Math.max(0, Math.min(imageNaturalWidth, dx / sx)),
      Math.max(0, Math.min(imageNaturalHeight, dy / sy)),
    ];
  };

  /* ---- Measure displayed image size ---- */
  const measureImage = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    setDisplaySize({ w: img.clientWidth, h: img.clientHeight });
  }, []);

  useEffect(() => {
    measureImage();
    window.addEventListener('resize', measureImage);
    return () => window.removeEventListener('resize', measureImage);
  }, [measureImage]);

  /* ---- Reset when initialCorners changes ---- */
  useEffect(() => {
    if (initialCorners) setCorners(initialCorners);
  }, [initialCorners]);

  /* ---- Drag helpers ---- */
  const getPointerPos = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return [clientX - rect.left, clientY - rect.top];
  };

  const clampToImage = ([dx, dy]) => [
    Math.max(0, Math.min(displaySize.w, dx)),
    Math.max(0, Math.min(displaySize.h, dy)),
  ];

  const onPointerDown = (index) => (e) => {
    e.preventDefault();
    draggingIndex.current = index;

    const onMove = (ev) => {
      if (draggingIndex.current === null) return;
      const pos = clampToImage(getPointerPos(ev));
      const nat = toNatural(pos);
      setCorners((prev) => {
        const next = [...prev];
        next[index] = nat;
        return next;
      });
    };

    const onUp = () => {
      draggingIndex.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      if (onChange) onChange(corners);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  };

  /* ---- Call onChange when corners settle ---- */
  useEffect(() => {
    if (onChange) onChange(corners);
  }, [corners]);

  const { sx, sy } = getScale();
  const displayCorners = corners.map(([x, y]) => [x * sx, y * sy]);
  const svgW = displaySize.w;
  const svgH = displaySize.h;
  const polyPoints = displayCorners.map(([x, y]) => `${x},${y}`).join(' ');

  const HANDLE_LABELS = ['TL', 'TR', 'BR', 'BL'];

  return (
    <div className="corner-adjuster" ref={containerRef}>
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Document to adjust"
        className="corner-adjuster-img"
        onLoad={measureImage}
        draggable={false}
      />

      {svgW > 0 && (
        <svg
          className="corner-adjuster-svg"
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
        >
          {/* Connecting lines */}
          <polygon
            points={polyPoints}
            fill="rgba(179,49,44,0.1)"
            stroke="#B3312C"
            strokeWidth="1.5"
            strokeDasharray="6 3"
          />

          {/* Draggable handles */}
          {displayCorners.map(([dx, dy], i) => (
            <g key={i}>
              <rect
                x={dx - 8} y={dy - 8}
                width={16} height={16}
                fill="#fff"
                stroke="#B3312C"
                strokeWidth="2"
                style={{ cursor: 'crosshair' }}
                onMouseDown={onPointerDown(i)}
                onTouchStart={onPointerDown(i)}
              />
              <text
                x={dx} y={dy + 4}
                textAnchor="middle"
                fontSize="7"
                fill="#B3312C"
                fontFamily="IBM Plex Mono, monospace"
                fontWeight="bold"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {HANDLE_LABELS[i]}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
};

export default CornerAdjuster;
