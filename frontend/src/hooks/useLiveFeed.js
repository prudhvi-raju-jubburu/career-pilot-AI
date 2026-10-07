import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * CareerPilot AI — Production Real-Time SSE Telemetry Hook
 * Connects to /api/stream/opportunities via Server-Sent Events.
 * Automatically invalidates react-query cache, deduplicates items,
 * and surfaces the animated "N new opportunities" pill with live data.
 */
export function useLiveFeed() {
  const queryClient = useQueryClient();
  const [newItems, setNewItems] = useState([]);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const seenIdsRef = useRef(new Set());
  const reconnectTimeoutRef = useRef(null);
  const backoffRef = useRef(1000);

  useEffect(() => {
    let eventSource = null;
    let isMounted = true;

    const connectSSE = () => {
      try {
        eventSource = new EventSource(`${API_BASE_URL}/api/stream/opportunities`);

        eventSource.onopen = () => {
          if (isMounted) {
            setIsConnected(true);
            backoffRef.current = 1000;
          }
        };

        eventSource.addEventListener('update', (e) => {
          if (!isMounted) return;
          try {
            const rawData = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
            const eventPayload = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

            if (eventPayload.type === 'new_opportunities') {
              const items = eventPayload.data?.items || [];
              const fresh = items.filter((item) => {
                const id = item.id || item.external_id || item.title;
                if (id && !seenIdsRef.current.has(id)) {
                  seenIdsRef.current.add(id);
                  return true;
                }
                return false;
              });

              if (fresh.length > 0) {
                setNewItems((prev) => [...fresh, ...prev].slice(0, 20));
                setHasNewAlert(true);
                // Trigger react-query cache invalidation
                queryClient.invalidateQueries({ queryKey: ['opportunities'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
              }
            } else if (eventPayload.type === 'application_stage_changed') {
              queryClient.invalidateQueries({ queryKey: ['applications'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            }
          } catch (err) {
            console.warn('Error processing SSE telemetry update:', err);
          }
        });

        eventSource.onerror = () => {
          if (!isMounted) return;
          setIsConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Exponential backoff reconnect (max 30s)
          const delay = Math.min(backoffRef.current, 30000);
          backoffRef.current *= 1.5;
          reconnectTimeoutRef.current = setTimeout(connectSSE, delay);
        };
      } catch (err) {
        console.warn('Could not initialize EventSource:', err);
      }
    };

    connectSSE();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [queryClient]);

  const ingestNewItems = useCallback(() => {
    const items = [...newItems];
    setNewItems([]);
    setHasNewAlert(false);
    return items;
  }, [newItems]);

  const dismissAlert = useCallback(() => {
    setHasNewAlert(false);
  }, []);

  return {
    hasNewAlert,
    newCount: newItems.length,
    newItems,
    isConnected,
    ingestNewItems,
    dismissAlert,
  };
}

export default useLiveFeed;
