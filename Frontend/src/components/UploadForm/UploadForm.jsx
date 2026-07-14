import { useRef, useState } from 'react';
import './UploadForm.css';

const UploadForm = ({ onFile, isUploading }) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    onFile(file);
  };

  const onInputChange = (e) => {
    handleFile(e.target.files[0]);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  return (
    <div
      id="upload-drop-zone"
      className={`upload-zone bracket-box${isDragging ? ' upload-zone--dragging' : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => !isUploading && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      aria-label="Click or drag and drop an image to upload"
    >
      <div className="bracket-box-inner">
        <div className="upload-zone-inner">
          <div className="upload-icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          </div>

          {isUploading ? (
            <div className="upload-uploading">
              <div className="spinner" />
              <p className="font-mono text-sm text-upper" style={{ marginTop: 12 }}>PROCESSING_UPLOAD...</p>
              <p className="console-line">AWAITING_RESPONSE</p>
            </div>
          ) : (
            <>
              <p className="upload-main-label">DRAG & DROP IMAGE</p>
              <p className="upload-sub-label">or click to select a file</p>
              <div className="upload-accepted">
                <span className="tag tag-muted">JPG</span>
                <span className="tag tag-muted">PNG</span>
                <span className="tag tag-muted">WEBP</span>
                <span className="tag tag-muted">TIFF</span>
              </div>
              <p className="upload-note font-mono">SINGLE_PAGE_MODE — multi-page deferred</p>
            </>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        id="upload-file-input"
        type="file"
        accept="image/*"
        onChange={onInputChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </div>
  );
};

export default UploadForm;
