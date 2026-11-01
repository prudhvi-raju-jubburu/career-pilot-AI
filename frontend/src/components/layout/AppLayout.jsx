import React, { useState } from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import MobileBottomNav from './MobileBottomNav';
import NetworkStatusBanner from '../NetworkStatusBanner';
import { CommandPalette } from '../ui/CommandPalette';

export default function AppLayout({ children, hideFooter = false, fullHeight = false }) {
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <div
      className="app-layout"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: fullHeight ? '100vh' : '100vh',
        height: fullHeight ? '100vh' : 'auto',
        overflow: fullHeight ? 'hidden' : 'visible',
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
          height: fullHeight ? 'calc(100vh - 64px)' : 'auto',
          overflow: fullHeight ? 'hidden' : 'visible',
        }}
      >
        {children}
      </main>

      {/* Footer across standard pages */}
      {!hideFooter && <Footer />}

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
