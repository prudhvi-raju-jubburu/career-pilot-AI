import React, { useState, useRef } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import { useToast } from '../../context/ToastContext';
import { uploadResume, analyzeResume, confirmResumeExtraction } from '../../services/api';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Plus,
  Trash2,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function ResumeUploadModal({ isOpen, onClose, onExtractionConfirmed }) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  // Upload & Extraction States
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Review step state
  const [step, setStep] = useState('upload'); // 'upload' | 'review'
  const [extractedData, setExtractedData] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const resetState = () => {
    setFile(null);
    setStep('upload');
    setExtractedData(null);
    setSelectedSkills({});
    setErrorMsg('');
    setUploadProgress(0);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

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
    const droppedFile = e.dataTransfer.files?.[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (f) => {
    setErrorMsg('');
    if (!f) return;

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const isPdfOrDocx = f.name.toLowerCase().endsWith('.pdf') || f.name.toLowerCase().endsWith('.docx') || validTypes.includes(f.type);

    if (!isPdfOrDocx) {
      setErrorMsg('Please upload a PDF (.pdf) or Word (.docx) resume file.');
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg('Resume file size exceeds the 10 MB limit.');
      return;
    }

    setFile(f);
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;

    try {
      setErrorMsg('');
      setUploading(true);
      setUploadProgress(30);

      const formData = new FormData();
      formData.append('resume', file);

      const uploadRes = await uploadResume(formData);
      if (!uploadRes?.success && !uploadRes?.data?.success) {
        throw new Error(uploadRes?.message || uploadRes?.data?.message || 'Resume upload failed');
      }

      setUploadProgress(65);
      setUploading(false);
      setAnalyzing(true);

      // Call analyze with save=false to allow student review first
      const analyzeRes = await analyzeResume({ save: false });
      setUploadProgress(100);

      const data = analyzeRes?.data || analyzeRes || {};
      setExtractedData(data);

      // Initialize selected skills (default: all checked)
      const initialSkills = {};
      const skillsObj = data.skills || {};
      Object.keys(skillsObj).forEach((cat) => {
        const list = Array.isArray(skillsObj[cat]) ? skillsObj[cat] : [];
        list.forEach((skill) => {
          initialSkills[`${cat}:${skill}`] = true;
        });
      });
      setSelectedSkills(initialSkills);

      setAnalyzing(false);
      setStep('review');
      toast.success('Resume extracted successfully! Review skills before applying to profile.');
    } catch (err) {
      setUploading(false);
      setAnalyzing(false);
      const msg = err.response?.data?.message || err.message || 'Failed to extract resume. Please check file format.';
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const toggleSkill = (catKey, skillName) => {
    const key = `${catKey}:${skillName}`;
    setSelectedSkills(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirmExtraction = async () => {
    if (!extractedData) return;

    try {
      setSaving(true);

      // Filter only selected skills
      const filteredSkills = {};
      const skillsObj = extractedData.skills || {};
      Object.keys(skillsObj).forEach((cat) => {
        const list = Array.isArray(skillsObj[cat]) ? skillsObj[cat] : [];
        filteredSkills[cat] = list.filter(skill => selectedSkills[`${cat}:${skill}`]);
      });

      const confirmedPayload = {
        confirmed_data: {
          ...extractedData,
          skills: filteredSkills,
        },
        selected_fields: ['skills', 'education', 'projects', 'experience']
      };

      const res = await confirmResumeExtraction(confirmedPayload);
      if (res?.success || res?.data?.success) {
        toast.success('Extracted skills successfully applied to your verified profile!');
        if (onExtractionConfirmed) {
          onExtractionConfirmed();
        }
        handleClose();
      } else {
        throw new Error(res?.message || res?.data?.message || 'Failed to confirm extraction');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to apply extracted skills.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'upload' ? 'Upload & Extract Resume Skills' : 'Review Extracted Resume Information'}
      size={step === 'upload' ? 'md' : 'lg'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
        {step === 'upload' ? (
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.45 }}>
              Upload your PDF or Word resume. Our AI parser extracts your verified skills, projects, and coursework for non-destructive review before updating your profile.
            </p>

            {/* Hidden native input so raw browser file picker never appears */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* Animated Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`skillgap-dropzone ${isDragging ? 'dragging' : ''}`}
            >
              <div className="skillgap-dropzone-icon-box">
                <UploadCloud className="w-8 h-8" />
              </div>

              {file ? (
                <div className="skillgap-file-preview-card" onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(37, 94, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary, #255eff)', flexShrink: 0 }}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div style={{ textAlign: 'left', minWidth: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </p>
                      <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ fontSize: '0.725rem', padding: '0.3rem 0.65rem' }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div>
                  <h4 className="skillgap-dropzone-title">
                    Click to browse or drag and drop your resume
                  </h4>
                  <p className="skillgap-dropzone-sub">
                    Supports PDF and Word (.docx) documents up to 10 MB
                  </p>
                </div>
              )}
            </div>

            {errorMsg && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {(uploading || analyzing) && (
              <div className="skillgap-extraction-progress">
                <div className="skillgap-extraction-status-row">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <RefreshCw className="w-4 h-4 animate-spin text-primary-500" />
                    <span>{uploading ? '1/2 Uploading resume document...' : '2/2 AI extracting competencies & projects...'}</span>
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <ProgressBar value={uploadProgress} max={100} color="primary" />
              </div>
            )}

            <div className="skillgap-modal-footer">
              <Button variant="ghost" onClick={handleClose} disabled={uploading || analyzing}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUploadAndAnalyze}
                disabled={!file || uploading || analyzing}
                iconLeft={uploading || analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              >
                {uploading || analyzing ? 'Analyzing...' : 'Extract Skills'}
              </Button>
            </div>
          </div>
        ) : (
          /* Step 2: Review Extracted Info */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(37, 94, 255, 0.08)', border: '1px solid rgba(37, 94, 255, 0.22)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck className="w-4 h-4 text-primary-500 shrink-0" />
                <span style={{ color: 'var(--text-primary)' }}>
                  Review extracted skills before applying. Uncheck any unwanted items.
                </span>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                Non-Destructive Merge
              </Badge>
            </div>

            {/* Extracted Skills List by Category */}
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '4px' }}>
              {extractedData?.skills && Object.keys(extractedData.skills).length > 0 ? (
                Object.keys(extractedData.skills).map((catKey) => {
                  const skills = Array.isArray(extractedData.skills[catKey]) ? extractedData.skills[catKey] : [];
                  if (skills.length === 0) return null;

                  return (
                    <div key={catKey} style={{ padding: '0.85rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.775rem', fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                          {catKey.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {skills.filter(s => selectedSkills[`${catKey}:${s}`]).length} of {skills.length} selected
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {skills.map((skill) => {
                          const isSelected = !!selectedSkills[`${catKey}:${skill}`];
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => toggleSkill(catKey, skill)}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '8px',
                                border: isSelected ? '1px solid rgba(37, 94, 255, 0.4)' : '1px solid var(--border)',
                                background: isSelected ? 'rgba(37, 94, 255, 0.12)' : 'var(--bg-secondary)',
                                color: isSelected ? 'var(--primary, #255eff)' : 'var(--text-secondary)',
                                textDecoration: isSelected ? 'none' : 'line-through',
                                opacity: isSelected ? 1 : 0.65,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: isSelected ? 'var(--primary, #255eff)' : 'transparent', border: isSelected ? 'none' : '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '9px' }}>
                                {isSelected && <Check className="w-2.5 h-2.5" />}
                              </span>
                              <span>{skill}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.775rem', color: 'var(--text-secondary)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  No skills could be detected from this resume document.
                </div>
              )}

              {/* Extracted Projects Preview */}
              {extractedData?.projects && extractedData.projects.length > 0 && (
                <div style={{ padding: '0.85rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Extracted Projects ({extractedData.projects.length})
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {extractedData.projects.map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name || 'Project'}</span>
                        {p.technologies && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>({(Array.isArray(p.technologies) ? p.technologies : [p.technologies]).join(', ')})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
              <Button variant="ghost" onClick={() => setStep('upload')}>
                Back to Upload
              </Button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmExtraction}
                  disabled={saving}
                  iconLeft={saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                >
                  {saving ? 'Saving to Profile...' : 'Confirm & Apply to Profile'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
