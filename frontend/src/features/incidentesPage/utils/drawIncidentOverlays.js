import { drawSkeleton, KP_CONF_THRESHOLD } from './skeletonUtils';

export function drawIncidentOverlays(ctx, details, source, width, height) {
  const canvas = { width, height };
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
    const zonaInvadida = (details.zona || []).find((z) => z.invadiu && (!z.source || z.source === source));
    const zonaConfig = zonaInvadida || details.zona_config;
    const zonePoints = zonaConfig?.source && zonaConfig.source !== source ? [] : (zonaConfig?.pontos || []);
    if (zonaInvadida && zonePoints.length >= 3) {
      ctx.strokeStyle = '#f97316'; // Laranja
      ctx.fillStyle = 'rgba(249,115,22,0.14)';
      ctx.lineWidth = Math.max(3, canvas.width * 0.006);
      ctx.setLineDash([15, 10]);
      ctx.beginPath();
      ctx.moveTo(zonePoints[0].x, zonePoints[0].y);
      zonePoints.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      
      const text = `⚠ ${zonaConfig?.nome || 'ZONA DE RISCO'} — P${zonaInvadida.pessoa_id ?? 0}`;
      ctx.font = `bold ${fontSize + 4}px monospace`;
      const tw = ctx.measureText(text).width;
      const labelX = Math.max(4, Math.min(zonePoints[0].x, canvas.width - tw - 24));
      const labelY = Math.max(fontSize + 20, Math.min(zonePoints[0].y, canvas.height - 8));
      ctx.fillStyle = 'rgba(249,115,22,0.9)';
      ctx.fillRect(labelX, labelY - fontSize - 16, tw + 16, fontSize + 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, labelX + 8, labelY - 8);
    }
}

