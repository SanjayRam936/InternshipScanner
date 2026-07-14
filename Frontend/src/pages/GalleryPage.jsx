import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listDocuments } from '../api/documentApi';
import StatusBadge from '../components/StatusBadge/StatusBadge';
import BottomNav from '../components/BottomNav/BottomNav';
import { formatDate } from '../utils/formatters';
import './GalleryPage.css';

/* Gallery: reuses GET /documents/ filtered to status === "completed".
   No dedicated gallery endpoint exists in the backend.
   Flagged as a placeholder — a real gallery endpoint with thumbnail generation
   would be a future backend addition. */

const API_ROOT = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';

const GalleryPage = () => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await listDocuments();
        const all = Array.isArray(data) ? data : data.results || [];
        setDocs(all.filter((d) => d.status === 'completed'));
      } catch {
        setError('Failed to load gallery.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="page-container">
      <header className="topbar">
        <span className="topbar-brand">SCAN_PRO_V1</span>
        <div className="topbar-icons">
          <button id="gallery-history-btn" className="topbar-icon-btn"
            onClick={() => navigate('/history')} aria-label="History">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
            </svg>
          </button>
          <button id="gallery-profile-btn" className="topbar-icon-btn"
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
        Home / <span>Gallery</span>
      </div>

      <main className="page-content">
        <div className="gallery-heading-row">
          <h1 className="history-heading">DOCUMENT GALLERY</h1>
          <span className="tag tag-muted">COMPLETED_ONLY</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '32px 0' }}>
            <div className="spinner" />
            <span className="font-mono text-sm text-muted text-upper">LOADING_GALLERY...</span>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : !docs.length ? (
          <div className="doc-history-empty">
            <p className="font-mono text-sm text-muted text-upper">NO_COMPLETED_DOCUMENTS</p>
            <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              Complete a scan to see it appear here.
            </p>
          </div>
        ) : (
          <div className="gallery-grid">
            {docs.map((doc) => {
              const thumb = doc.pages?.[0]?.scanned_image;
              const thumbUrl = thumb
                ? (thumb.startsWith('http') ? thumb : `${API_ROOT}${thumb}`)
                : null;
              return (
                <button
                  key={doc.id}
                  id={`gallery-doc-${doc.id}`}
                  className="gallery-card"
                  onClick={() => navigate(`/result/${doc.id}`)}
                >
                  <div className="gallery-thumb">
                    {thumbUrl ? (
                      <img src={thumbUrl} alt={doc.title || `Document ${doc.id}`} />
                    ) : (
                      <div className="gallery-thumb-placeholder font-mono text-xs text-muted text-upper">
                        NO_PREVIEW
                      </div>
                    )}
                  </div>
                  <div className="gallery-card-meta">
                    <p className="gallery-card-title">{doc.title || `DOC_${doc.id}`}</p>
                    <p className="gallery-card-date font-mono text-xs text-muted">
                      {formatDate(doc.uploaded_at)}
                    </p>
                    <StatusBadge confidence={doc.average_confidence} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default GalleryPage;
