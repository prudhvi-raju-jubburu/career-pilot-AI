import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import useNetworkStatus from '../hooks/useNetworkStatus';

export default function NetworkStatusBanner() {
  const { isOnline, showStatus } = useNetworkStatus();

  if (!showStatus) return null;

  return (
    <aside
      className={`network-status-banner ${isOnline ? 'online' : 'offline'}`}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <Wifi size={15} />
          <span>Back online. All features active.</span>
        </>
      ) : (
        <>
          <WifiOff size={15} />
          <span>You are offline. Some features and live APIs may be unavailable.</span>
        </>
      )}
    </aside>
  );
}
