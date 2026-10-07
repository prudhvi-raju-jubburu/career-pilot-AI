import { useState, useRef, useCallback } from 'react';

/**
 * useStream manages token-by-token simulated or real SSE text streams.
 * Includes abort/stop generation capability and thinking state.
 */
export function useStream() {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const timerRef = useRef(null);
  const abortControllerRef = useRef(null);

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

  const startStream = useCallback((fullText, onComplete) => {
    stopStream();
    setStreamedText('');
    setIsThinking(true);
    setIsStreaming(true);

    // Initial simulated thinking pause (400ms)
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
      }, 25);
    }, 450);
  }, [stopStream]);

  return {
    streamedText,
    isStreaming,
    isThinking,
    startStream,
    stopStream,
  };
}

export default useStream;
