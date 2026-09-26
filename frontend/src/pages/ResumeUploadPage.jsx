import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { uploadResume, analyzeResume, getResumeInfo } from '../services/api';

export default function ResumeUploadPage() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [existingResume, setExistingResume] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [statusStage, setStatusStage] = useState('idle'); // 'idle' | 'uploading' | 'reading' | 'extracting' | 'completed' | 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Load existing resume metadata if already uploaded
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await getResumeInfo();
        if (res?.data?.uploaded && res.data.resume) {
          setExistingResume(res.data.resume);
        }
      } catch (err) {
        console.warn('Could not fetch resume info:', err.message);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchExisting();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    setErrorMessage('');
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF file (.pdf).');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMessage('Resume file size exceeds the 10 MB limit.');
      return;
    }
    setFile(selectedFile);
  };

  const handleProcessResume = async () => {
    if (!file) return;
    setErrorMessage('');

    try {
      // Step 1: Uploading
      setStatusStage('uploading');
      setStatusMessage('Uploading resume document securely...');
      const formData = new FormData();
      formData.append('resume', file);
      await uploadResume(formData);

      // Step 2: Reading & Normalizing
      setStatusStage('reading');
      setStatusMessage('Reading PDF structure and extracting clean text...');
      await new Promise((r) => setTimeout(r, 600));

      // Step 3: AI Extraction
      setStatusStage('extracting');
      setStatusMessage('Analyzing education, skills, projects & experience...');
      await analyzeResume();

      // Step 4: Completed
      setStatusStage('completed');
      setStatusMessage('Resume analyzed successfully! Preparing your profile review...');
      setTimeout(() => {
        navigate('/profile/review');
      }, 1000);

    } catch (err) {
      setStatusStage('error');
      setErrorMessage(err.message || 'Failed to process resume. Please try another PDF.');
    }
  };

  const handleAnalyzeExisting = async () => {
    setErrorMessage('');
    try {
      setStatusStage('reading');
      setStatusMessage('Accessing uploaded resume document...');
      await new Promise((r) => setTimeout(r, 400));

      setStatusStage('extracting');
      setStatusMessage('Analyzing education, skills, projects & experience...');
      await analyzeResume();

      setStatusStage('completed');
      setStatusMessage('Resume analyzed successfully! Preparing your profile review...');
      setTimeout(() => {
        navigate('/profile/review');
      }, 1000);
    } catch (err) {
      setStatusStage('error');
      setErrorMessage(err.message || 'Failed to analyze existing resume.');
    }
  };

  const getStageProgress = () => {
    switch (statusStage) {
      case 'uploading': return 25;
      case 'reading': return 55;
      case 'extracting': return 85;
      case 'completed': return 100;
      case 'error': return 100;
      default: return 0;
    }
  };

  return (
    <PageContainer>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Badge variant="purple" size="sm" dot>
              Resume-First Onboarding
            </Badge>
          </div>
          <h1 className="text-h1">Upload Your Resume</h1>
          <p className="text-small" style={{ fontSize: '0.95rem', marginTop: '0.35rem', maxWidth: '650px' }}>
            Never fill out repetitive job application forms again. Upload your resume to extract skills, college metrics, and projects with provenance tracking.
          </p>
        </div>

        {/* Existing Resume Banner if already uploaded */}
        {existingResume && statusStage === 'idle' && (
          <Card variant="raised" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--color-primary-600)' }}>
            <Card.Content style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-50)',
                    color: 'var(--color-primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileCheck size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.95rem' }}>
                    {existingResume.fileName || 'Uploaded Resume'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Uploaded {existingResume.uploadedAt ? new Date(existingResume.uploadedAt).toLocaleDateString() : 'recently'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <Button variant="ghost" size="sm" onClick={handleAnalyzeExisting} icon={<Sparkles size={14} />}>
                  Re-extract AI Profile
                </Button>
                <Link to="/profile/review">
                  <Button variant="secondary" size="sm">
                    Review Extracted Data
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="primary" size="sm">
                    View Verified Profile
                  </Button>
                </Link>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Upload Card */}
        <Card variant="default" style={{ marginBottom: '2rem' }}>
          <Card.Content style={{ padding: '2.5rem' }}>
            {statusStage === 'idle' ? (
              <>
                {/* Drag and Drop Box */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? 'var(--color-primary-500)' : 'var(--border-control)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    backgroundColor: isDragging ? 'var(--color-primary-50)' : 'var(--color-bg)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    boxShadow: 'var(--shadow-sunken)',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-primary-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <UploadCloud size={28} />
                  </div>

                  {file ? (
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--color-text)', fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                        <FileText size={18} color="var(--color-primary-600)" />
                        {file.name}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                        Drag &amp; Drop your resume PDF here
                      </h3>
                      <p className="text-small" style={{ marginBottom: '1rem' }}>
                        or click to browse your files from your computer
                      </p>
                      <Badge variant="neutral" size="sm">
                        PDF format only (Max 10 MB)
                      </Badge>
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div
                    style={{
                      marginTop: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--color-danger-bg)',
                      border: '1px solid var(--color-danger-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-danger-dark)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Action button */}
                <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  {file && (
                    <Button variant="ghost" size="md" onClick={() => setFile(null)}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="md"
                    disabled={!file}
                    onClick={handleProcessResume}
                    icon={<Sparkles size={16} />}
                  >
                    Parse &amp; Extract Profile
                  </Button>
                </div>
              </>
            ) : (
              /* Live Progress Staged Tracker */
              <div style={{ padding: '1rem 0', textAlign: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor:
                      statusStage === 'completed'
                        ? 'var(--color-success-bg)'
                        : statusStage === 'error'
                        ? 'var(--color-danger-bg)'
                        : 'var(--color-primary-50)',
                    color:
                      statusStage === 'completed'
                        ? 'var(--color-success-dark)'
                        : statusStage === 'error'
                        ? 'var(--color-danger-dark)'
                        : 'var(--color-primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    boxShadow: 'var(--shadow-raised)',
                  }}
                >
                  {statusStage === 'completed' ? (
                    <CheckCircle2 size={32} />
                  ) : statusStage === 'error' ? (
                    <AlertCircle size={32} />
                  ) : (
                    <RefreshCw size={28} className="spin" />
                  )}
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                  {statusStage === 'completed'
                    ? 'Analysis Complete!'
                    : statusStage === 'error'
                    ? 'Resume Processing Issue'
                    : 'Processing Your Resume'}
                </h3>

                {statusStage === 'error' ? (
                  <div
                    style={{
                      maxWidth: '480px',
                      margin: '0 auto 1.75rem',
                      padding: '0.85rem 1.25rem',
                      backgroundColor: 'var(--color-danger-bg)',
                      border: '1px solid var(--color-danger-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-danger-dark)',
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                    }}
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '2px' }}>Could not extract resume information</div>
                      <div>{errorMessage}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-small" style={{ marginBottom: '1.75rem', maxWidth: '440px', margin: '0 auto 1.75rem' }}>
                    {statusMessage}
                  </p>
                )}

                <div style={{ maxWidth: '480px', margin: '0 auto 2rem' }}>
                  <ProgressBar
                    value={getStageProgress()}
                    variant={statusStage === 'completed' ? 'success' : statusStage === 'error' ? 'danger' : 'primary'}
                    size="md"
                    showPercentage={statusStage !== 'error'}
                  />
                </div>

                {statusStage === 'error' && (
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        setStatusStage('idle');
                        setErrorMessage('');
                      }}
                    >
                      Choose Different PDF
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={file ? handleProcessResume : handleAnalyzeExisting}
                      icon={<RefreshCw size={16} />}
                    >
                      Retry Processing
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Security & Data Guarantee Callout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <ShieldCheck size={18} color="var(--color-success-dark)" />
            <span className="text-small">Private &amp; Secure Cloud Storage</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <Sparkles size={18} color="var(--color-primary-600)" />
            <span className="text-small">Zero Hallucinations Guarantee</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
