import { useState, useEffect } from 'react';

/**
 * useTypewriter: Smoothly cycles through an array of words
 * with typing, pausing, and deleting animations.
 */
export function useTypewriter(words = [], typeSpeed = 100, deleteSpeed = 50, pauseTime = 1800) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!words || words.length === 0) return;

    const fullWord = words[currentWordIndex];
    let timeout;

    if (!isDeleting) {
      if (currentText.length < fullWord.length) {
        timeout = setTimeout(() => {
          setCurrentText(fullWord.slice(0, currentText.length + 1));
        }, typeSpeed);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pauseTime);
      }
    } else {
      if (currentText.length > 0) {
        timeout = setTimeout(() => {
          setCurrentText(fullWord.slice(0, currentText.length - 1));
        }, deleteSpeed);
      } else {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words, typeSpeed, deleteSpeed, pauseTime]);

  return currentText;
}
