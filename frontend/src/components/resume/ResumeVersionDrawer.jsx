import React, { useState } from 'react';
import {
  X, History, Copy, Trash2, Edit3, Check, Calendar, ArrowRight,
  Plus, Bookmark, ShieldCheck, Download
} from 'lucide-react';
import Button from '../ui/Button';

export default function ResumeVersionDrawer({
  isOpen,
  onClose,
  versions = [],
  currentVersionId = null,
  onSelectVersion,
  onDeleteVersion,
  onDuplicateVersion,
  onRenameVersion,
  onSaveCurrentAsNew
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);

  if (!isOpen) return null;

  const handleStartRename = (v) => {
    setEditingId(v.id);
    setEditTitle(v.title);
  };

  const handleSaveRename = (vId) => {
    if (editTitle.trim()) {
      onRenameVersion && onRenameVersion(vId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCreateNew = (e) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onSaveCurrentAsNew && onSaveCurrentAsNew(newTitle.trim());
      setNewTitle('');
      setIsSavingNew(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <History size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Saved Resume Versions
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.3rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action: Save Current as New Version */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: '#ffffff' }}>
          {isSavingNew ? (
            <form onSubmit={handleCreateNew} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Python Backend Intern Resume"
                autoFocus
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <Button size="sm" type="submit" variant="primary">
                Save
              </Button>
              <Button size="sm" type="button" variant="outline" onClick={() => setIsSavingNew(false)}>
                Cancel
              </Button>
            </form>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSavingNew(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} /> Save Current Draft As Named Version
            </Button>
          )}
        </div>

        {/* Versions List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {versions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Bookmark size={32} style={{ opacity: 0.4, margin: '0 auto 0.75rem' }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>No saved versions yet</div>
              <div style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
                Save customized resumes for different target roles or job descriptions.
              </div>
            </div>
          ) : (
            versions.map((v) => {
              const isCurrent = v.id === currentVersionId;
              const isEditing = editingId === v.id;
              const score = v.quality_assessment?.score;

              return (
                <div
                  key={v.id}
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: '10px',
                    border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: isCurrent ? 'rgba(37, 94, 255, 0.03)' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '0.4rem', flex: 1, marginRight: '0.5rem' }}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '0.3rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid var(--primary)',
                            fontSize: '0.85rem',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(v.id)}
                          style={{ padding: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }}
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {v.title}
                          </span>
                          {isCurrent && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'var(--primary)', color: '#ffffff', padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                              Active
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          Role: <strong>{v.target_role || 'General'}</strong> • Template: <em>{v.template_id}</em>
                        </div>
                      </div>
                    )}

                    {score !== undefined && (
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: score >= 80 ? '#10b981' : '#255eff' }}>
                        {score}%
                      </span>
                    )}
                  </div>

                  {/* Metadata and Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} /> {new Date(v.updated_at || v.created_at).toLocaleDateString()}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <button
                        type="button"
                        onClick={() => handleStartRename(v)}
                        title="Rename version"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateVersion && onDuplicateVersion(v.id)}
                        title="Duplicate version"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete resume version "${v.title}"?`)) {
                            onDeleteVersion && onDeleteVersion(v.id);
                          }
                        }}
                        title="Delete version"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectVersion && onSelectVersion(v);
                            onClose();
                          }}
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            padding: '0.25rem 0.5rem',
                            marginLeft: '0.3rem',
                          }}
                        >
                          Load
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
