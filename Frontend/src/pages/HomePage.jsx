import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UploadForm from '../components/UploadForm/UploadForm';
import ImagePreview from '../components/ImagePreview/ImagePreview';
import BottomNav from '../components/BottomNav/BottomNav';
import useDocumentUpload from '../hooks/useDocumentUpload';
import { generateSessionId, generateIsoSensitivity } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const SESSION_ID = generateSessionId();
const ISO = generateIsoSensitivity();

const HomePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isUploading, document, error, uploadFile, reset } = useDocumentUpload();
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFile = useCallback(async (file) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    try {
      await uploadFile(file);
    } catch {
      setPreviewUrl(null);
    }
  }, [uploadFile]);

  const handleRescan = () => {
    reset();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const firstPage = document?.pages?.[0];
  const corners = firstPage?.detected_corners || null;
  const contourDetected = firstPage?.contour_detected ?? null;

  return (
    <div className="page-container">
      {/* Top Bar */}
      <header className="topbar">
        <Link to="/" className="topbar-brand">SCAN_PRO_V1</Link>
        <div className="topbar-icons">
          <button id="topbar-history-btn" className="topbar-icon-btn"
            onClick={() => navigate('/history')} aria-label="History" title="HISTORY">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
            </svg>
          </button>
          <button id="topbar-profile-btn" className="topbar-icon-btn"
            onClick={() => navigate('/profile')} aria-label="Profile" title="PROFILE">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        Home / <span>Upload</span>
      </div>

      <main className="page-content">
        {/* Error state */}
        {error && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* After upload: preview */}
        {document && previewUrl ? (
          <div className="home-preview-layout">
            <div className="home-preview-left">
              <ImagePreview
                imageUrl={previewUrl}
                corners={corners}
                contourDetected={contourDetected}
              />
            </div>

            <div className="home-preview-right">
              <div className="home-meta bracket-box">
                <div className="bracket-box-inner">
                  <h2 className="home-meta-title font-mono text-upper">
                    SCAN_ANALYSIS
                  </h2>

                  <div className="home-meta-rows">
                    <div className="home-meta-row">
                      <span className="home-meta-key font-mono text-xs">SESSION_ID</span>
                      <span className="home-meta-val font-mono text-xs">{SESSION_ID}</span>
                    </div>
                    <div className="home-meta-row">
                      <span className="home-meta-key font-mono text-xs">ISO_SENSITIVITY</span>
                      <span className="home-meta-val font-mono text-xs">{ISO}</span>
                    </div>
                    <div className="home-meta-row">
                      <span className="home-meta-key font-mono text-xs">DOC_STATUS</span>
                      <span className="home-meta-val font-mono text-xs">
                        {document.status?.toUpperCase()}
                      </span>
                    </div>
                    <div className="home-meta-row">
                      <span className="home-meta-key font-mono text-xs">AUTO_DETECT</span>
                      <span className="home-meta-val font-mono text-xs">
                        <span className={`tag ${contourDetected ? 'tag-green' : 'tag-muted'}`} style={{ fontSize: 9 }}>
                          {contourDetected ? 'ON' : 'FALLBACK'}
                        </span>
                      </span>
                    </div>
                    <div className="home-meta-row">
                      <span className="home-meta-key font-mono text-xs">LANGUAGE</span>
                      <span className="home-meta-val font-mono text-xs">
                        {document.language?.toUpperCase() || 'ENG'}
                      </span>
                    </div>
                  </div>

                  {!contourDetected && (
                    <div className="alert alert-error" style={{ marginTop: 16, fontSize: 11 }}>
                      ⚠ CONTOUR_NOT_DETECTED — using full image. You can adjust corners manually.
                    </div>
                  )}

                  <div className="home-action-row">
                    <button id="rescan-btn" className="btn btn-outline" onClick={handleRescan}>
                      ↺ RESCAN
                    </button>
                    <button
                      id="continue-btn"
                      className="btn btn-primary"
                      onClick={() => navigate(`/review/${document.id}`)}
                    >
                      CONTINUE →
                    </button>
                  </div>

                  <div className="home-console-log">
                    <p className="console-line">UPLOAD_COMPLETE</p>
                    <p className="console-line">AWAITING_REVIEW...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Upload state */
          <div className="home-upload-wrap">
            <div className="home-upload-header">
              <h1 className="home-title">DOCUMENT SCANNER</h1>
              <p className="font-mono text-sm text-muted" style={{ marginTop: 8 }}>
                Upload an image to extract text, generate PDF or DOCX.
              </p>
            </div>
            <UploadForm onFile={handleFile} isUploading={isUploading} />

            {!isUploading && (
              <div className="home-sys-status">
                <span className="console-line">SYS.INIT();</span>
                <span className="console-line">AWAITING_INPUT...</span>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default HomePage;
