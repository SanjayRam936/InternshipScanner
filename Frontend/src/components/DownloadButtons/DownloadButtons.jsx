import './DownloadButtons.css';

const DownloadButtons = ({ pdfUrl, docxUrl }) => (
  <div className="download-buttons">
    <a
      href={pdfUrl}
      download
      id="download-pdf-btn"
      className={`download-btn${!pdfUrl ? ' download-btn--disabled' : ''}`}
      onClick={(e) => !pdfUrl && e.preventDefault()}
      aria-disabled={!pdfUrl}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" />
      </svg>
      DOWNLOAD PDF
    </a>

    <a
      href={docxUrl}
      download
      id="download-docx-btn"
      className={`download-btn${!docxUrl ? ' download-btn--disabled' : ''}`}
      onClick={(e) => !docxUrl && e.preventDefault()}
      aria-disabled={!docxUrl}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
      DOWNLOAD DOCX
    </a>
  </div>
);

export default DownloadButtons;
