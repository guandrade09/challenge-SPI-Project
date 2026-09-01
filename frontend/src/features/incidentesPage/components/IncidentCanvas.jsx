import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import imgNotFound from '../../../assets/Codexis/img-not-found.jpg';

export function IncidentCanvas({ imgUrl, details, source = 'frontal' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(imgUrl);

  // Sincroniza o estado se a prop `imgUrl` mudar
  useEffect(() => {
    setLoading(true);
    setError(false);
    setCurrentSrc(imgUrl || imgNotFound);
  }, [imgUrl]);

  const handleError = () => {
    setError(true);
    setLoading(false);
    setCurrentSrc(imgNotFound);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  return (
    <div className="relative w-full aspect-video bg-neutral-950/80 flex items-center justify-center overflow-hidden rounded-xl border border-neutral-800">
      
      {/* 1. SKELETON LOADING (Exibido durante o carregamento) */}
      {loading && (
        <div className="absolute inset-0 z-20 bg-neutral-900 animate-pulse flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-800 animate-spin border-2 border-neutral-700 border-t-amber-400" />
          <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
            Carregando Imagem...
          </span>
        </div>
      )}

      {/* 2. FALLBACK BADGE (Indicador visual caso o link esteja quebrado) */}
      {error && (
        <div className="absolute top-2 left-2 z-30 bg-red-950/90 border border-red-800 text-red-300 text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1.5 shadow-md">
          <ImageOff size={12} />
          <span>Imagem não encontrada</span>
        </div>
      )}

      {/* 3. ELEMENTO DE IMAGEM DA CÂMERA */}
      <img
        src={currentSrc}
        alt={`Feed Câmera ${source}`}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Aqui fica o Canvas overlay para marcação/bounding box caso necessário */}
    </div>
  );
}

export default IncidentCanvas;