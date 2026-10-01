import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import ProgressBar from './ProgressBar';

export default function FileUpload({
  onFileSelect,
  accept = '.pdf',
  maxSizeMB = 10,
  label = 'Upload Resume',
  helper = 'Supports PDF format up to 10MB',
  progress = null,
  uploading = false,
  error = null,
  currentFile = null,
  onClear,
  className = '',
  style = {},
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPropagate(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndPropagate(e.target.files[0]);
    }
  };

  const validateAndPropagate = (file) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      if (onFileSelect) onFileSelect(null, `File size exceeds ${maxSizeMB}MB limit`);
      return;
    }
    if (onFileSelect) onFileSelect(file, null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', ...style }} className={className}>
      {label && (
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {label}
        </span>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current && inputRef.current.click()}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--primary)' : error ? 'var(--danger)' : 'var(--border-control)'}`,
          borderRadius: 'var(--radius-lg)',
          backgroundColor: isDragOver ? 'var(--primary-subtle)' : 'var(--surface)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          transition: 'all var(--transition-fast)',
          boxShadow: 'var(--shadow-sunken)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          style={{ display: 'none' }}
          disabled={uploading}
        />

        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: isDragOver ? 'var(--primary-subtle)' : 'var(--bg-secondary)',
            color: isDragOver ? 'var(--primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform var(--transition-fast)',
            transform: isDragOver ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          <UploadCloud size={26} />
        </div>

        <div>
          <div style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            <span style={{ color: 'var(--primary)' }}>Click to browse</span> or drag and drop your file here
          </div>
          <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
            {helper}
          </div>
        </div>
      </div>

      {currentFile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
            <FileText size={18} className="text-primary" />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.84375rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentFile.name}
              </div>
              <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                {(currentFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>

          {onClear && !uploading && (
            <button
              type="button"
              onClick={onClear}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
                display: 'flex',
              }}
              title="Remove file"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {uploading && progress !== null && (
        <div style={{ marginTop: '0.25rem' }}>
          <ProgressBar value={progress} label="Uploading..." size="sm" variant="primary" />
        </div>
      )}

      {error && (
        <div style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
