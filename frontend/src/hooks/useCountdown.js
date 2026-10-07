import { useState, useEffect } from 'react';

/**
 * Hook to compute countdown until a given deadline.
 * Returns formatted text, daysLeft, and color states (isWarning: < 7 days, isUrgent: < 3 days).
 */
export function useCountdown(deadlineDate) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(deadlineDate));

  useEffect(() => {
    if (!deadlineDate) return;
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(deadlineDate));
    }, 60000); // recalculate every minute

    return () => clearInterval(timer);
  }, [deadlineDate]);

  return timeLeft;
}

function calculateTimeLeft(deadlineDate) {
  if (!deadlineDate) {
    return { formatted: 'Ongoing', daysLeft: 999, isWarning: false, isUrgent: false };
  }

  const target = new Date(deadlineDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { formatted: 'Expired', daysLeft: 0, isWarning: false, isUrgent: true, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

  let formatted = '';
  if (days > 1) formatted = `${days} days left`;
  else if (days === 1) formatted = '1 day left';
  else formatted = `${hours}h left`;

  return {
    formatted,
    daysLeft: days,
    isWarning: days <= 7 && days > 2, // Amber warning
    isUrgent: days <= 2,              // Red urgent
    isExpired: false,
  };
}

export default useCountdown;
