import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listDocuments, searchDocuments } from '../api/documentApi';
import DocumentHistory from '../components/DocumentHistory/DocumentHistory';
import './HistoryPage.css';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await listDocuments();
      setDocs(Array.isArray(data) ? data : data.results || []);
    } catch {
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQ.trim()) { fetchAll(); return; }
    setSearching(true);
    try {
      const { data } = await searchDocuments(searchQ.trim());
      setDocs(Array.isArray(data) ? data : data.results || []);
    } catch {
      setError('Search failed.');
    } finally {
      setSearching(false);
    }
  };

  const handleDeleted = (id) => setDocs((prev) => prev.filter((d) => d.id !== id));

  const filtered = filterStatus === 'all'
    ? docs
    : docs.filter((d) => d.status === filterStatus);

  return (
    <div className="page-container">
      <header className="topbar">
        <span className="topbar-brand">SCAN_PRO_V1</span>
        <form id="history-search-form" onSubmit={handleSearch} className="history-search-form">
          <input
            id="history-search-input"
            className="history-search-input font-mono"
            type="search"
            placeholder="Search extracted text..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          <button id="history-search-btn" type="submit" className="history-search-btn"
            disabled={searching} aria-label="Search">
            {searching ? '...' : '→'}
          </button>
        </form>
        <div className="topbar-icons">
          <button id="history-profile-btn" className="topbar-icon-btn"
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
        Home / <span>History</span>
      </div>

      <main className="page-content">
        <div className="history-heading-row">
          <h1 className="history-heading">PROCESSING HISTORY</h1>
          <div className="history-filter">
            {['all', 'completed', 'uploaded', 'failed'].map((s) => (
              <button
                key={s}
                id={`filter-${s}-btn`}
                className={`history-filter-btn${filterStatus === s ? ' history-filter-btn--active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '32px 0' }}>
            <div className="spinner" />
            <span className="font-mono text-sm text-muted text-upper">LOADING_RECORDS...</span>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <DocumentHistory documents={filtered} onDeleted={handleDeleted} />
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
