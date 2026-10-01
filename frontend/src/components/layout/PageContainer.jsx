import React from 'react';
import AppLayout from './AppLayout';

export default function PageContainer({ children, className = '', style = {} }) {
  return (
    <AppLayout>
      <div className={`page-container ${className}`} style={style}>
        {children}
      </div>
    </AppLayout>
  );
}
