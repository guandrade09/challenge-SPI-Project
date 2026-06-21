// src/components/shared/PerformanceObserver.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePerformanceStore } from '../../store/usePerformanceStore';

export function PerformanceObserver() {
  const location = useLocation();
  
  const incrementPagesLoaded = usePerformanceStore((s) => s.incrementPagesLoaded);
  const syncPerformanceData = usePerformanceStore((s) => s.syncPerformanceData);

  // Escuta cada mudança de página/rota
  useEffect(() => {
    incrementPagesLoaded();
  }, [location.pathname, incrementPagesLoaded]);

  // Envia os dados acumulados a cada 1 minuto
  useEffect(() => {
    const interval = setInterval(() => {
      syncPerformanceData();
    }, 60000); 

    return () => clearInterval(interval);
  }, [syncPerformanceData]);

  // Garante o envio caso o usuário feche a aba ou saia do sistema
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        syncPerformanceData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncPerformanceData]);

  return null;
}

export default PerformanceObserver;