import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { confirmDocument } from '../api/documentApi';
import './LoadingPage.css';

const LOG_SEQUENCE = [
  'SYS.INIT();',
  'MOUNTING_PIPELINE...',
  'AWAITING_INPUT...',
  'LOADING_IMAGE_BUFFER...',
  'RUNNING_PERSPECTIVE_WARP...',
  'PROCESSING_OCR...',
  'EXTRACTING_TEXT_BUFFER...',
  'GENERATING_PDF...',
  'GENERATING_DOCX...',
  'FINALIZING_OUTPUT...',
];

const LoadingPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [visibleLogs, setVisibleLogs] = useState([]);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const logInterval = useRef(null);
  const logIndex = useRef(0);
  const hasCalled = useRef(false);

  /* ---- Animate console log lines independently of the real request ---- */
  const startLogs = () => {
    logIndex.current = 0;
    setVisibleLogs([]);
    logInterval.current = setInterval(() => {
      if (logIndex.current < LOG_SEQUENCE.length) {
        const line = LOG_SEQUENCE[logIndex.current];
        setVisibleLogs((prev) => [...prev, line]);
        logIndex.current++;
      }
    }, 600);
  };

  const stopLogs = () => {
    if (logInterval.current) clearInterval(logInterval.current);
  };

  /* ---- Call confirm, navigate on result ---- */
  const runConfirm = async () => {
    setError('');
    setRetrying(false);
    startLogs();

    try {
      const { data } = await confirmDocument(documentId);
      stopLogs();
      if (data.status === 'completed') {
        navigate(`/result/${documentId}`, { replace: true });
      } else {
        setError(`Unexpected status: ${data.status}`);
      }
    } catch (err) {
      stopLogs();
      const msg = err.response?.data?.detail || 'Processing failed. Please try again.';
      setError(msg);
    }
  };

  useEffect(() => {
    if (!hasCalled.current) {
      hasCalled.current = true;
      runConfirm();
    }
    return () => stopLogs();
  }, []);

  return (
    <div className="loading-page">
      {/* Corner tick marks */}
      <div className="loading-tick loading-tick--tl" aria-hidden="true" />
      <div className="loading-tick loading-tick--tr" aria-hidden="true" />
      <div className="loading-tick loading-tick--bl" aria-hidden="true" />
      <div className="loading-tick loading-tick--br" aria-hidden="true" />

      {/* Header */}
      <div className="loading-header">
        <span className="topbar-brand" style={{ fontSize: 14 }}>SCAN_PRO_V1</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <span className="tag tag-muted">SYS_VER_1.4.2</span>
          <span className="tag tag-muted">ENV_PROD</span>
        </div>
      </div>

      {/* Center: page skeleton + scanning line */}
      <div className="loading-center">
        {error ? (
          <div className="loading-error">
            <div className="alert alert-error" role="alert">
              <p className="font-mono font-bold text-upper" style={{ marginBottom: 8 }}>
                PROCESSING_FAILED
              </p>
              <p className="font-mono text-sm">{error}</p>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
              <button
                id="retry-confirm-btn"
                className="btn btn-primary"
                disabled={retrying}
                onClick={() => {
                  setRetrying(true);
                  hasCalled.current = false;
                  runConfirm();
                }}
              >
                ↺ RETRY
              </button>
              <Link to="/" className="btn btn-outline">← HOME</Link>
            </div>
          </div>
        ) : (
          <div className="loading-scanner">
            <div className="loading-page-skeleton" aria-hidden="true">
              <div className="loading-scan-line" />
              {[...Array(8)].map((_, i) => (
                <div key={i} className="loading-skeleton-line"
                  style={{ width: `${60 + (i % 3) * 15}%`, opacity: 0.3 + (i % 4) * 0.1 }} />
              ))}
            </div>
            <p className="font-mono text-upper font-bold" style={{ marginTop: 20, fontSize: 12 }}>
              INITIALIZING_SCAN_PIPELINE...
            </p>
          </div>
        )}
      </div>

      {/* Console log area */}
      <div className="loading-console" aria-live="polite" aria-label="System log">
        {visibleLogs.map((line, i) => (
          <p key={i} className="console-line loading-console-line"
            style={{ opacity: i === visibleLogs.length - 1 ? 1 : 0.5 }}>
            {line}
          </p>
        ))}
        {!error && <span className="loading-cursor font-mono" aria-hidden="true">_</span>}
      </div>
    </div>
  );
};

export default LoadingPage;
