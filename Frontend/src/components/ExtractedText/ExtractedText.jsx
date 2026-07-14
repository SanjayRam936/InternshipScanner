import './ExtractedText.css';

const ExtractedText = ({ text, isLoading }) => (
  <div className="extracted-text">
    <div className="extracted-text-header">
      <span className="font-mono text-xs text-upper" style={{ color: '#F5F3EC' }}>
        EXTRACTED_TEXT_BUFFER
      </span>
      <span className="tag" style={{ color: '#888', borderColor: '#555', fontSize: 9 }}>
        {text ? `${text.split(/\s+/).filter(Boolean).length} WORDS` : 'EMPTY'}
      </span>
    </div>

    <div className="extracted-text-body">
      {isLoading ? (
        <div className="extracted-text-loading">
          <div className="spinner" />
          <p className="font-mono text-sm" style={{ color: 'var(--text-muted)', marginTop: 12 }}>
            READING_BUFFER...
          </p>
        </div>
      ) : text ? (
        <pre className="extracted-text-content">{text}</pre>
      ) : (
        <p className="extracted-text-empty font-mono">
          — NO_TEXT_DETECTED —
        </p>
      )}
    </div>
  </div>
);

export default ExtractedText;
