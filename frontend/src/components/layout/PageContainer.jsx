import React from 'react';
import AppLayout from './AppLayout';

export default function PageContainer({
  children,
  className = '',
  style = {},
  hideFooter = false,
  fullHeight = false,
  noPadding = false,
}) {
  return (
    <AppLayout hideFooter={hideFooter} fullHeight={fullHeight}>
      <div
        className={noPadding ? className : `page-container ${className}`}
        style={{
          ...(noPadding
            ? {
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                minHeight: 0,
                boxSizing: 'border-box',
                overflow: 'hidden',
              }
            : {}),
          ...style,
        }}
      >
        {children}
      </div>
    </AppLayout>
  );
}
