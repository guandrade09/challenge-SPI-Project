// src/components/shared/PerformanceObserver.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePerformanceStore } from '../../store/usePerformanceStore';

export function PerformanceObserver() {
  const location = useLocation();
  const incrementPagesLoaded = usePerformanceStore((s) => s.incrementPagesLoaded);
  const syncPerformanceData = usePerformanceStore((s) => s.syncPerformanceData);

  // Escuta cada mudança de página/rota com segurança
  useEffect(() => {
    incrementPagesLoaded();
  }, [location.pathname]); 

  // Envia os dados acumulados a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      syncPerformanceData();
    }, 300000); 

    return () => clearInterval(interval);
  }, [syncPerformanceData]);

  // Envia se o usuário fechar a aba
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