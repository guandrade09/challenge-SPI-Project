// src/features/incidentesPage/components/IncidentCanvas.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImageOff } from 'lucide-react';
import imgNotFound from '../../../assets/Codexis/img-not-found.jpg';

// Importando as lógicas de esqueleto do seu arquivo utilitário
import { drawIncidentOverlays } from '../utils/drawIncidentOverlays';

function IncidentCanvasImage({ imgUrl, details, source, showOverlays, hasLateralFrame, showEpi, showReba }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(imgUrl || imgNotFound);

  // Referências para a imagem e o canvas
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  // ── LÓGICA DE DESENHO NO CANVAS ──
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    
    // Se não carregou os elementos ou a imagem deu erro, não desenha
    if (!canvas || !img || !img.naturalWidth || error) return;

    // Iguala a resolução interna do canvas à resolução real da imagem
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    
    // Limpa o frame anterior
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawIncidentOverlays(ctx, details, source, canvas.width, canvas.height, { hasLateralFrame, showEpi, showReba });
  }, [details, source, error, hasLateralFrame, showEpi, showReba]);

  // Handler quando a imagem termina de carregar
  const handleLoad = () => {
    setLoading(false);
    draw(); // Chama o desenho assim que a imagem estiver pronta
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
    setCurrentSrc(imgNotFound);
  };

  // Se o objeto details mudar e a imagem já estiver carregada, redesenha
  useEffect(() => {
    if (!loading) draw();
  }, [details, loading, draw]);

  return (
    <div className="relative w-full aspect-video bg-neutral-950/80 flex items-center justify-center overflow-hidden rounded-xl border border-neutral-800 group">
      
      {/* SKELETON LOADING */}
      {loading && (
        <div className="absolute inset-0 z-20 bg-neutral-900 animate-pulse flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-800 animate-spin border-2 border-neutral-700 border-t-amber-400" />
          <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
            Carregando Imagem...
          </span>
        </div>
      )}

      {/* FALLBACK BADGE */}
      {error && (
        <div className="absolute top-2 left-2 z-30 bg-red-950/90 border border-red-800 text-red-300 text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1.5 shadow-md">
          <ImageOff size={12} />
          <span>Imagem não encontrada</span>
        </div>
      )}

      {/* ELEMENTO DE IMAGEM */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={`Feed Câmera ${source}`}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* CANVAS SOBREPOSTO */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 object-contain ${
          loading || !showOverlays ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
}

export function IncidentCanvas({ imgUrl, details, source = 'frontal', showOverlays = true, hasLateralFrame = false, showEpi = true, showReba = true }) {
  return (
    <IncidentCanvasImage
      key={`${source}:${imgUrl || 'sem-imagem'}`}
      imgUrl={imgUrl}
      details={details}
      source={source}
      showOverlays={showOverlays}
      hasLateralFrame={hasLateralFrame}
      showEpi={showEpi}
      showReba={showReba}
    />
  );
}

export default IncidentCanvas;
