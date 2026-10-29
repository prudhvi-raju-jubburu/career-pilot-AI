import React, { useState } from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import MobileBottomNav from './MobileBottomNav';
import NetworkStatusBanner from '../NetworkStatusBanner';
import { CommandPalette } from '../ui/CommandPalette';

export default function AppLayout({ children }) {
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <div
      className="app-layout"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        width: '100%',
        position: 'relative',
      }}
    >
      <NetworkStatusBanner />

      {/* Top Navbar on all authenticated pages */}
      <Navbar onOpenCmd={() => setCmdOpen(true)} />

      {/* Main App Workspace Area */}
      <main
        className="animate-fade-in"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          width: '100%',
        }}
      >
        {children}
      </main>

      {/* Footer across all pages */}
      <Footer />

      {/* Mobile Bottom Navigation for quick thumb reach on mobile */}
      <MobileBottomNav />

      {/* Global Command Palette */}
      {cmdOpen && (
        <CommandPalette
          isOpen={cmdOpen}
          setIsOpen={setCmdOpen}
          onClose={() => setCmdOpen(false)}
        />
      )}
    </div>
  );
}
