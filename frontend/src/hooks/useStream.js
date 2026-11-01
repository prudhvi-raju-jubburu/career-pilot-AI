import { useState, useRef, useCallback } from 'react';

/**
 * useStream manages genuine token-by-token SSE text streams and metadata.
 * Includes abort/stop generation capability and thinking/streaming states.
 */
export function useStream() {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamSources, setStreamSources] = useState([]);
  const [streamActions, setStreamActions] = useState([]);
  const [streamMetadata, setStreamMetadata] = useState(null);

  const abortControllerRef = useRef(null);
  const timerRef = useRef(null);

  const stopStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsThinking(false);
  }, []);

  /**
   * Real SSE incremental streaming from backend endpoint.
   */
  const startSSEStream = useCallback(async ({
    url,
    payload,
    token,
    onStart,
    onSources,
    onActions,
    onToken,
    onDone,
    onError,
  }) => {
    stopStream();
    setStreamedText('');
    setStreamSources([]);
    setStreamActions([]);
    setStreamMetadata(null);
    setIsThinking(true);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedText = '';

    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const headers = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errMessage = `HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          errMessage = errJson?.message || errMessage;
        } catch (_) {}
        throw new Error(errMessage);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep partial line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const dataPayload = trimmed.slice(6).trim();
          if (!dataPayload) continue;

          try {
            const event = JSON.parse(dataPayload);
            const evtType = event?.type;

            if (evtType === 'start') {
              setIsThinking(false);
              setStreamMetadata(event);
              if (onStart) onStart(event);
            } else if (evtType === 'sources') {
              const srcList = event?.sources || [];
              setStreamSources(srcList);
              if (onSources) onSources(srcList);
            } else if (evtType === 'actions') {
              const actList = event?.suggested_actions || [];
              setStreamActions(actList);
              if (onActions) onActions(actList);
            } else if (evtType === 'token') {
              setIsThinking(false);
              const tok = event?.token || '';
              accumulatedText += tok;
              setStreamedText(accumulatedText);
              if (onToken) onToken(tok, accumulatedText);
            } else if (evtType === 'done') {
              setIsStreaming(false);
              setIsThinking(false);
              const fullText = event?.full_text || accumulatedText;
              setStreamedText(fullText);
              if (onDone) onDone({ ...event, full_text: fullText });
              return;
            } else if (evtType === 'error') {
              if (event?.recoverable) {
                // Recoverable pre-token error; continues if handled
                console.warn('Recoverable stream warning:', event?.error);
              } else {
                throw new Error(event?.error || 'Streaming error');
              }
            }
          } catch (jsonErr) {
            console.warn('Could not parse SSE event JSON:', dataPayload, jsonErr);
          }
        }
      }

      // Stream closed by server without explicit done event
      setIsStreaming(false);
      setIsThinking(false);
      if (onDone) onDone({ full_text: accumulatedText });

    } catch (err) {
      if (err.name === 'AbortError') {
        // User aborted intentionally
        setIsStreaming(false);
        setIsThinking(false);
        return;
      }
      console.error('SSE Stream error:', err);
      setIsStreaming(false);
      setIsThinking(false);
      if (onError) onError(err);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [stopStream]);

  /**
   * Fallback simulated stream for strings if called with full text
   */
  const startStream = useCallback((fullText, onComplete) => {
    stopStream();
    setStreamedText('');
    setIsThinking(true);
    setIsStreaming(true);

    setTimeout(() => {
      setIsThinking(false);
      const tokens = fullText.split(/(\s+)/);
      let currentIndex = 0;
      let accumulated = '';

      timerRef.current = setInterval(() => {
        if (currentIndex < tokens.length) {
          accumulated += tokens[currentIndex];
          setStreamedText(accumulated);
          currentIndex += 1;
        } else {
          stopStream();
          if (onComplete) onComplete(accumulated);
        }
      }, 20);
    }, 250);
  }, [stopStream]);

  return {
    streamedText,
    isStreaming,
    isThinking,
    streamSources,
    streamActions,
    streamMetadata,
    startSSEStream,
    startStream,
    stopStream,
  };
}

export default useStream;
