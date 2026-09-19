// src/features/incidentesPage/components/IncidentCanvas.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImageOff } from 'lucide-react';
import imgNotFound from '../../../assets/Codexis/img-not-found.jpg';

// Importando as lógicas de esqueleto do seu arquivo utilitário
import { drawSkeleton, KP_CONF_THRESHOLD } from '../utils/skeletonUtils';

export function IncidentCanvas({ imgUrl, details, source = 'frontal' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(imgUrl);

  // Referências para a imagem e o canvas
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setCurrentSrc(imgUrl || imgNotFound);
  }, [imgUrl]);

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

    if (!details) return;

    const fontSize = Math.max(14, canvas.width * 0.018);
    ctx.font = `bold ${fontSize}px monospace`;

    // 1. DESENHO DE EPIs (Câmera Frontal)
    if (source === 'frontal') {
      (details.epi || []).forEach(({ label, confidence, bbox }) => {
        if (!bbox || bbox.length < 4) return;
        const [x1, y1, x2, y2] = bbox;
        const isAusente = label?.toLowerCase().includes('ausente');
        
        ctx.strokeStyle = isAusente ? '#ef4444' : '#10b981'; // Vermelho ou Verde
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

        ctx.font = `bold ${fontSize}px monospace`;
        const text = `${label} ${Math.round(parseFloat(confidence) * 100)}%`;
        const tw = ctx.measureText(text).width;
        
        ctx.fillStyle = isAusente ? 'rgba(239,68,68,0.85)' : 'rgba(16,185,129,0.85)';
        ctx.fillRect(x1, y1 - fontSize - 6, tw + 8, fontSize + 6);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, x1 + 4, y1 - 4);
      });
    }

    // 2. DESENHO ERGONOMIA/ESQUELETO (Câmera Lateral)
    if (source === 'lateral') {
      (details.ergonomia || []).forEach(({ pessoa_id, reba_score, reba_level, queda, bbox, keypoints }) => {
        const rebaColor = (reba_score ?? 0) >= 7 ? '#ef4444' : (reba_score ?? 0) >= 4 ? '#f59e0b' : '#10b981';

        // Desenha a Bounding Box da pessoa (Tracejada)
        if (bbox && bbox.length === 4) {
          const [x1, y1, x2, y2] = bbox;
          ctx.strokeStyle = rebaColor + '99';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 4]);
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          ctx.setLineDash([]); // Reseta o tracejado para os próximos desenhos
        }

        // Desenha o Esqueleto usando a sua função utilitária
        drawSkeleton(ctx, keypoints, rebaColor);

        // Label flutuante do REBA
        // Usa o KP_CONF_THRESHOLD importado para garantir que a âncora siga um ponto confiável
        const anchorX = (keypoints?.[0]?.[2] >= KP_CONF_THRESHOLD ? keypoints[0][0] : bbox?.[0]) ?? 20;
        const anchorY = (keypoints?.[0]?.[2] >= KP_CONF_THRESHOLD ? keypoints[0][1] : bbox?.[1]) ?? 40;
        
        ctx.font = `bold ${fontSize}px monospace`;
        const labelText = `P${pessoa_id ?? 0} REBA ${reba_score ?? '?'} ${reba_level ?? ''}${queda ? ' ⚠QUEDA' : ''}`;
        const tw = ctx.measureText(labelText).width;
        
        ctx.fillStyle = rebaColor + 'ee';
        ctx.fillRect(anchorX - 2, anchorY - fontSize - 10, tw + 8, fontSize + 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, anchorX + 2, anchorY - 4);
      });
    }

    // 3. DESENHO DA ZONA DE RISCO INVADIDA
    const zonaInvadida = (details.zona || []).find((z) => z.invadiu);
    if (zonaInvadida) {
      ctx.strokeStyle = '#f97316'; // Laranja
      ctx.lineWidth = 6;
      ctx.setLineDash([15, 10]);
      ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
      ctx.setLineDash([]);
      
      const text = `⚠ ZONA INVADIDA P${zonaInvadida.pessoa_id ?? 0}`;
      ctx.font = `bold ${fontSize + 4}px monospace`;
      const tw = ctx.measureText(text).width;
      
      ctx.fillStyle = 'rgba(249,115,22,0.9)';
      ctx.fillRect(10, canvas.height - fontSize - 20, tw + 16, fontSize + 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, 18, canvas.height - 12);
    }
  }, [details, source, error]);

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
          loading ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
}

export default IncidentCanvas;