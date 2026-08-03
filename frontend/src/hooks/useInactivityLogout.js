import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';

// 🚀 Definindo o tempo unificado de inatividade (ex: 15 minutos)
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; 

export const useInactivityLogout = () => {
  const logout = useAuthStore((s) => s.logout);
  const resetInactivityTimer = useAuthStore((s) => s.resetInactivityTimer);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const timeoutRef = useRef(null);

  const resetTimer = () => {
    // 1. Atualiza o timestamp lastActivity no Zustand
    resetInactivityTimer();

    // 2. Reinicia o contador local do React
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_LIMIT_MS);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    // Escuta eventos e reinicia o timer
    events.forEach((event) => document.addEventListener(event, resetTimer));

    // Inicializa o primeiro timer logo que entra na aplicação
    resetTimer();

    return () => {
      events.forEach((event) => document.removeEventListener(event, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isAuthenticated, logout]);
};