import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Atualiza o estado se a tela mudar
    const listener = (e) => setMatches(e.matches);
    
    // Suporte moderno para listeners de matchMedia
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Hook utilitário específico para Mobile (breakpoint padrão do Tailwind md: 768px)
export function useIsMobile(breakpoint = 768) {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}