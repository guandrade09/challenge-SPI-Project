import { useEffect, useState } from 'react';

// Mede um elemento (clientWidth/clientHeight) e acompanha redimensionamentos (janela,
// fullscreen, grade 2×2). Recebe o ELEMENTO (via callback-ref + useState), não um ref
// mutável, para funcionar mesmo quando o elemento monta/desmonta depois.
// O ResizeObserver dispara logo após observe(), então não é preciso medir de forma síncrona.
export function useElementSize(element) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!element) return undefined;

    const update = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };

    if (typeof ResizeObserver === 'undefined') {
      const frame = requestAnimationFrame(update);
      window.addEventListener('resize', update);
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', update);
      };
    }

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return size;
}

export default useElementSize;
