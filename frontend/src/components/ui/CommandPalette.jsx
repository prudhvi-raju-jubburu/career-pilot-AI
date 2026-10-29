import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Compass,
  Layers,
  FileText,
  TrendingUp,
  Sparkles,
  User,
  Settings,
  Search,
  ExternalLink
} from 'lucide-react';

export function CommandPalette({ isOpen, setIsOpen, onClose }) {
  const navigate = useNavigate();

  const handleClose = () => {
    if (onClose) onClose();
    if (setIsOpen) setIsOpen(false);
  };

  useEffect(() => {
    const down = (e) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (setIsOpen) setIsOpen((open) => !open);
        else if (onClose && isOpen) onClose();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setIsOpen, onClose, isOpen]);

  if (!isOpen) return null;

  const handleSelect = (callback) => {
    handleClose();
    callback();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}
      onClick={handleClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px' }}>
        <Command label="Global Command Palette">
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', padding: '0 1rem' }}>
            <Search size={18} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
            <Command.Input placeholder="Search commands, opportunities, tools... (Esc to close)" />
          </div>

          <Command.List>
            <Command.Empty>No matching actions or opportunities found.</Command.Empty>

            <Command.Group heading="Navigation">
              <Command.Item onSelect={() => handleSelect(() => navigate('/dashboard'))}>
                <LayoutDashboard size={16} />
                <span>Dashboard Overview</span>
              </Command.Item>
              <Command.Item onSelect={() => handleSelect(() => navigate('/opportunities'))}>
                <Compass size={16} />
                <span>Opportunities Explorer</span>
              </Command.Item>
              <Command.Item onSelect={() => handleSelect(() => navigate('/applications'))}>
                <Layers size={16} />
                <span>Application Tracker & Kanban</span>
              </Command.Item>
              <Command.Item onSelect={() => handleSelect(() => navigate('/profile?tab=resume'))}>
                <FileText size={16} />
                <span>Resume &amp; ATS Workspace (Profile)</span>
              </Command.Item>
              <Command.Item onSelect={() => handleSelect(() => navigate('/skill-gap'))}>
                <TrendingUp size={16} />
                <span>Skill Gap & Roadmaps</span>
              </Command.Item>
              <Command.Item onSelect={() => handleSelect(() => navigate('/ai-advisor'))}>
                <Sparkles size={16} />
                <span>AI Career Advisor Chat</span>
              </Command.Item>
              <Command.Item onSelect={() => handleSelect(() => navigate('/profile'))}>
                <User size={16} />
                <span>Student Profile & Provenance</span>
              </Command.Item>
              <Command.Item onSelect={() => handleSelect(() => navigate('/settings'))}>
                <Settings size={16} />
                <span>Account Settings</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Quick Actions">
              <Command.Item onSelect={() => handleSelect(() => navigate('/opportunities?type=internship'))}>
                <Compass size={16} />
                <span>Filter Internships</span>
              </Command.Item>
              <Command.Item onSelect={() => handleSelect(() => navigate('/opportunities?type=hackathon'))}>
                <ExternalLink size={16} />
                <span>Explore Hackathons</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

export default CommandPalette;
