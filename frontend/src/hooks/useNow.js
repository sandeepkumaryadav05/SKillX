import { useEffect, useState } from 'react';

/**
 * Returns the current timestamp, refreshed on an interval.
 * Keeps relative time labels ("5m ago", "Starts in 2 hrs") fresh without
 * calling Date.now() during render.
 */
export const useNow = (intervalMs = 30000) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
};
