import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../StatusBadge/StatusBadge';
import { deleteDocument } from '../../api/documentApi';
import { formatDate } from '../../utils/formatters';
import './DocumentHistory.css';

const PAGE_SIZE = 10;

const DocumentHistory = ({ documents: allDocs, onDeleted }) => {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const visible = allDocs.slice(0, visibleCount);
  const hasMore = visibleCount < allDocs.length;

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteDocument(id);
      setConfirmDeleteId(null);
      if (onDeleted) onDeleted(id);
    } catch {
      alert('Failed to delete document. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (!allDocs.length) {
    return (
      <div className="doc-history-empty">
        <p className="font-mono text-sm text-muted text-upper">NO_RECORDS_FOUND</p>
        <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
          Upload your first document to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="doc-history">
      <div className="doc-history-table-wrap">
        <table className="doc-history-table" role="table" aria-label="Document history">
          <thead>
            <tr>
              <th>DOCUMENT / ORIGIN</th>
              <th>TIMESTAMP</th>
              <th>CONFIDENCE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((doc) => (
              <tr key={doc.id} className="doc-history-row">
                <td>
                  <div className="doc-title">{doc.title || `DOC_${doc.id}`}</div>
                  {/* ORIGIN: cosmetic flavor — no backend field, static label */}
                  <div className="doc-origin font-mono text-xs text-muted">LOCAL_UPLOAD</div>
                </td>
                <td>
                  <span className="font-mono text-xs">{formatDate(doc.uploaded_at)}</span>
                </td>
                <td>
                  <StatusBadge confidence={doc.average_confidence} />
                </td>
                <td>
                  <span className={`tag ${doc.status === 'completed' ? 'tag-green' : doc.status === 'failed' ? 'tag-red' : 'tag-muted'}`}>
                    {doc.status?.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className="doc-actions">
                    {doc.status === 'completed' && (
                      <button
                        id={`view-doc-${doc.id}`}
                        className="doc-action-btn"
                        onClick={() => navigate(`/result/${doc.id}`)}
                      >
                        VIEW
                      </button>
                    )}
                    <button
                      id={`delete-doc-${doc.id}`}
                      className="doc-action-btn doc-action-btn--danger"
                      onClick={() => setConfirmDeleteId(doc.id)}
                    >
                      DEL
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* LOAD MORE — client-side only; real pagination requires backend ?page= param */}
      {hasMore && (
        <div className="doc-history-more">
          <button
            id="load-more-docs-btn"
            className="btn btn-outline"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          >
            LOAD MORE ({allDocs.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className="doc-confirm-overlay" role="dialog" aria-modal="true"
          aria-labelledby="confirm-delete-title">
          <div className="doc-confirm-box bracket-box">
            <div className="bracket-box-inner">
              <p id="confirm-delete-title" className="font-mono text-upper font-bold"
                style={{ marginBottom: 12 }}>
                CONFIRM_DELETE
              </p>
              <p className="font-mono text-sm" style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                This action cannot be undone. The document and all associated files will be permanently removed.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button id="confirm-delete-yes-btn" className="btn btn-danger"
                  onClick={() => handleDelete(confirmDeleteId)} disabled={deleting}>
                  {deleting ? 'DELETING...' : 'CONFIRM →'}
                </button>
                <button id="confirm-delete-cancel-btn" className="btn btn-outline"
                  onClick={() => setConfirmDeleteId(null)} disabled={deleting}>
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentHistory;
