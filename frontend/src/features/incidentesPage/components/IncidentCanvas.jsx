import React, { useEffect, useRef, useCallback } from 'react';
import { drawSkeleton, KP_CONF_THRESHOLD } from '../utils/skeletonUtils';

export function IncidentCanvas({ imgUrl, details, source = 'frontal' }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.naturalWidth) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!details) return;

    const fontSize = Math.max(12, canvas.width * 0.018);
    ctx.font = `bold ${fontSize}px monospace`;

    if (source === 'frontal') {
      (details.epi || []).forEach(({ label, confidence, bbox }) => {
        if (!bbox || bbox.length < 4) return;
        const [x1, y1, x2, y2] = bbox;
        const isAusente = label?.toLowerCase().includes('ausente');
        ctx.strokeStyle = isAusente ? '#ef4444' : '#10b981';
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

        const text = `${label} ${Math.round(parseFloat(confidence) * 100)}%`;
        const tw = ctx.measureText(text).width;
        ctx.fillStyle = isAusente ? 'rgba(239,68,68,0.85)' : 'rgba(16,185,129,0.85)';
        ctx.fillRect(x1, y1 - fontSize - 6, tw + 8, fontSize + 6);
        ctx.fillStyle = '#fff';
        ctx.fillText(text, x1 + 4, y1 - 4);
      });
    }

    if (source === 'lateral') {
      (details.ergonomia || []).forEach(({ pessoa_id, reba_score, reba_level, queda, bbox, keypoints }) => {
        const rebaColor = (reba_score ?? 0) >= 7 ? '#ef4444' : (reba_score ?? 0) >= 4 ? '#f59e0b' : '#10b981';

        if (bbox && bbox.length === 4) {
          const [x1, y1, x2, y2] = bbox;
          ctx.strokeStyle = rebaColor + '99';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          ctx.setLineDash([]);
        }

        drawSkeleton(ctx, keypoints, rebaColor);

        const anchorX = (keypoints?.[0]?.[2] >= KP_CONF_THRESHOLD ? keypoints[0][0] : bbox?.[0]) ?? 8;
        const anchorY = (keypoints?.[0]?.[2] >= KP_CONF_THRESHOLD ? keypoints[0][1] : bbox?.[1]) ?? (8 + (pessoa_id ?? 0) * 30);
        
        const label = `P${pessoa_id ?? 0} REBA ${reba_score ?? '?'} ${reba_level ?? ''}${queda ? ' ⚠QUEDA' : ''}`;
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = rebaColor + 'dd';
        ctx.fillRect(anchorX - 2, anchorY - fontSize - 8, tw + 8, fontSize + 6);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, anchorX + 2, anchorY - 4);
      });
    }

    (details.zona || []).forEach(({ pessoa_id, invadiu }) => {
      if (!invadiu) return;
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
      ctx.setLineDash([]);
      ctx.font = `bold ${fontSize}px monospace`;
      const text = `⚠ ZONA INVADIDA P${pessoa_id ?? 0}`;
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = 'rgba(249,115,22,0.85)';
      ctx.fillRect(4, canvas.height - fontSize - 10, tw + 8, fontSize + 8);
      ctx.fillStyle = '#fff';
      ctx.fillText(text, 8, canvas.height - 6);
    });
  }, [details, source]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if (img.complete) draw();
    else img.addEventListener('load', draw);

    window.addEventListener('resize', draw);

    return () => {
      img.removeEventListener('load', draw);
      window.removeEventListener('resize', draw);
    };
  }, [draw, imgUrl]);

  if (!imgUrl) {
    return (
      <div className="w-full h-48 bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-500 text-sm">
        Imagem não disponível
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <img
        ref={imgRef}
        src={imgUrl}
        alt="frame do incidente"
        className="w-full rounded-xl object-contain"
        style={{ display: 'block' }}
        onLoad={draw}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full rounded-xl pointer-events-none"
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
}

export default IncidentCanvas;