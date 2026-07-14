import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';

const INACTIVITY_LIMIT_MS = 950000; // 15 minutes

export const useInactivityLogout = () => {
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const timeoutRef = useRef(null);

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_LIMIT_MS);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    // Attach listener to reset timer on each event
    events.forEach((event) => document.addEventListener(event, resetTimer));

    // Start the initial timer
    resetTimer();

    return () => {
      events.forEach((event) => document.removeEventListener(event, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isAuthenticated, logout]);
};