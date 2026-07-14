import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDocument } from '../api/documentApi';
import ImagePreview from '../components/ImagePreview/ImagePreview';
import ExtractedText from '../components/ExtractedText/ExtractedText';
import DownloadButtons from '../components/DownloadButtons/DownloadButtons';
import StatusBadge from '../components/StatusBadge/StatusBadge';
import { formatDate } from '../utils/formatters';
import './ResultPage.css';

const API_ROOT = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';

const ResultPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getDocument(documentId);
        setDoc(data);
      } catch {
        setError('Failed to load result.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [documentId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'var(--bg)' }}>
        <div className="spinner" />
        <p className="font-mono text-sm text-muted text-upper">LOADING_RESULT...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'var(--bg)', padding: 24 }}>
        <div className="alert alert-error">{error || 'Document not found.'}</div>
        <Link to="/" className="btn btn-outline">← HOME</Link>
      </div>
    );
  }

  const page = doc.pages?.[0];
  const scannedImageUrl = page?.scanned_image
    ? (page.scanned_image.startsWith('http') ? page.scanned_image : `${API_ROOT}${page.scanned_image}`)
    : null;
  const pdfUrl = doc.pdf_file
    ? (doc.pdf_file.startsWith('http') ? doc.pdf_file : `${API_ROOT}${doc.pdf_file}`)
    : null;
  const docxUrl = doc.docx_file
    ? (doc.docx_file.startsWith('http') ? doc.docx_file : `${API_ROOT}${doc.docx_file}`)
    : null;

  return (
    <div className="page-container">
      {/* Top Bar */}
      <header className="topbar">
        <span className="topbar-brand">SCAN_PRO_V1</span>
        <nav className="result-topnav">
          {['Scanner', 'Gallery', 'History', 'Settings'].map((item) => (
            <button key={item} className="result-topnav-link font-mono text-xs text-upper"
              onClick={() => navigate(item === 'Scanner' ? '/' : item === 'Settings' ? '/profile' : `/${item.toLowerCase()}`)}>
              {item}
            </button>
          ))}
        </nav>
        <div className="topbar-icons">
          <button id="result-history-btn" className="topbar-icon-btn"
            onClick={() => navigate('/history')} aria-label="History">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
            </svg>
          </button>
          <button id="result-profile-btn" className="topbar-icon-btn"
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
        <button className="breadcrumb-back" onClick={() => navigate('/')}>
          ← ← SCAN ANOTHER DOCUMENT
        </button>
      </div>

      <div className="result-title-bar">
        <span className="font-mono text-xs text-muted">
          {doc.title || `DOC_${doc.id}`}
        </span>
        <StatusBadge confidence={doc.average_confidence} />
      </div>

      <main className="result-layout page-content-wide">
        {/* Left: scanned image */}
        <div className="result-left">
          {scannedImageUrl ? (
            <ImagePreview
              imageUrl={scannedImageUrl}
              corners={null}
              label="OPTICAL_PREVIEW_Z1"
              contourDetected={null}
            />
          ) : (
            <div className="result-no-image bracket-box">
              <div className="bracket-box-inner">
                <p className="font-mono text-sm text-muted text-upper">
                  IMAGE_NOT_AVAILABLE
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: extracted text + downloads */}
        <div className="result-right">
          <ExtractedText text={doc.full_text} />
          <DownloadButtons pdfUrl={pdfUrl} docxUrl={docxUrl} />
        </div>
      </main>

      {/* Bottom status strip */}
      <footer className="result-status-strip">
        <div className="result-status-item">
          <span className="font-mono text-xs text-muted text-upper">OCR_ENGINE_STATUS</span>
          <span className="font-mono text-xs" style={{ color: 'var(--success)' }}>
            ● SYSTEM_OPTIMAL
          </span>
        </div>
        <div className="result-status-item">
          <span className="font-mono text-xs text-muted text-upper">COMPLETED_AT</span>
          <span className="font-mono text-xs">{formatDate(doc.created_at || doc.uploaded_at)}</span>
        </div>
        <div className="result-status-item">
          {/* SECURITY_PROTOCOL: cosmetic display only — not a real backend security claim */}
          <span className="font-mono text-xs text-muted text-upper">SECURITY_PROTOCOL</span>
          <span className="font-mono text-xs text-muted">AES_256_GCM [COSMETIC]</span>
        </div>
      </footer>
    </div>
  );
};

export default ResultPage;
