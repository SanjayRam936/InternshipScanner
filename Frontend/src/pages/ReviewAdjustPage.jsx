import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import CornerAdjuster from '../components/CornerAdjuster/CornerAdjuster';
import { getDocument, updateCorners } from '../api/documentApi';
import './ReviewAdjustPage.css';

const ReviewAdjustPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rotation, setRotation] = useState(0); // client-side only
  const [currentCorners, setCurrentCorners] = useState(null);
  const initialCorners = useRef(null);

  const page = doc?.pages?.[0];
  const imageUrl = page?.original_image
    ? (page.original_image.startsWith('http')
        ? page.original_image
        : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${page.original_image}`)
    : null;

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getDocument(documentId);
        setDoc(data);
        const corners = data.pages?.[0]?.detected_corners;
        if (corners) {
          initialCorners.current = corners;
          setCurrentCorners(corners);
        }
      } catch {
        setError('Failed to load document.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [documentId]);

  const handleReset = () => {
    if (initialCorners.current) {
      setCurrentCorners([...initialCorners.current]);
    }
  };

  const handleUseFullImage = () => {
    if (!page) return;
    const { natural_width: w, natural_height: h } = page;
    setCurrentCorners([[0, 0], [w, 0], [w, h], [0, h]]);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      // PATCH corners only if user moved them from detected
      const initial = initialCorners.current;
      const moved = currentCorners && JSON.stringify(currentCorners) !== JSON.stringify(initial);
      if (moved && currentCorners) {
        await updateCorners(documentId, [
          { page_number: 1, corners: currentCorners },
        ]);
      }
      // Navigate to loading — LoadingPage calls confirm()
      navigate(`/loading/${documentId}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save corners. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="review-loading">
        <div className="spinner" />
        <p className="font-mono text-sm text-muted text-upper" style={{ marginTop: 16 }}>
          LOADING_DOCUMENT...
        </p>
      </div>
    );
  }

  if (error && !doc) {
    return (
      <div className="review-loading">
        <div className="alert alert-error">{error}</div>
        <Link to="/" className="btn btn-outline" style={{ marginTop: 16 }}>← HOME</Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Top Bar */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button id="review-back-btn" className="topbar-icon-btn"
            onClick={() => navigate(-1)} aria-label="Go back">
            ←
          </button>
          <span className="topbar-brand">SCAN_PRO_V1</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="tag tag-red">CALIBRATION_ACTIVE</span>
          <button id="review-history-btn" className="topbar-icon-btn"
            onClick={() => navigate('/history')} aria-label="History">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
            </svg>
          </button>
          <button id="review-profile-btn" className="topbar-icon-btn"
            onClick={() => navigate('/profile')} aria-label="Profile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </button>
        </div>
      </header>

      <div className="breadcrumb">
        <span className="font-mono text-xs">DOC_REF: </span>
        <span>{documentId}</span>
      </div>

      {error && (
        <div className="alert alert-error" style={{ margin: '16px 24px' }}>{error}</div>
      )}

      {/* Main adjuster */}
      <div className="review-main">
        <div
          className="review-image-wrap"
          style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.3s' }}
        >
          {imageUrl && currentCorners ? (
            <CornerAdjuster
              imageUrl={imageUrl}
              initialCorners={currentCorners}
              imageNaturalWidth={page?.natural_width}
              imageNaturalHeight={page?.natural_height}
              onChange={setCurrentCorners}
            />
          ) : (
            <div className="review-no-image">
              <p className="font-mono text-sm text-muted text-upper">IMAGE_NOT_AVAILABLE</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="review-toolbar">
        <div className="review-toolbar-left">
          <button
            id="review-rotate-btn"
            className="review-tool-btn"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            title="Client-side preview rotation only — does not rotate the saved image"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" />
            </svg>
            ROTATE*
          </button>
          <button
            id="review-reset-btn"
            className="review-tool-btn"
            onClick={handleReset}
          >
            ↺ RESET
          </button>
        </div>
        <div className="review-toolbar-right">
          <button
            id="use-full-image-btn"
            className="review-tool-btn"
            onClick={handleUseFullImage}
            style={{ fontSize: 10 }}
          >
            USE FULL IMAGE
          </button>
          <button
            id="confirm-scan-btn"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <><div className="spinner" style={{ width: 14, height: 14 }} /> SAVING...</>
            ) : (
              'CONFIRM & SCAN →'
            )}
          </button>
        </div>
      </div>

      <p className="review-rotate-note font-mono text-xs text-muted">
        * ROTATE is a preview-only transform. The backend has no rotate endpoint — the saved image is unchanged.
      </p>
    </div>
  );
};

export default ReviewAdjustPage;
