import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function PageContainer({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="layout-shell">
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Main Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Pane */}
      <div className="page-main-layout">
        <Topbar onToggleMobile={() => setMobileOpen((prev) => !prev)} />
        <main className="page-content-wrapper animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
