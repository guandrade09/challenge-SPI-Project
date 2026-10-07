import { drawSkeleton, KP_CONF_THRESHOLD } from './skeletonUtils.js';
import { normalizeConfidence } from '../../../utils/eventValidation.js';
import { getFrameOverlayData, getIncidentCameraDetails, getIncidentFrameMetadata } from './frameOverlayData.js';

export function drawIncidentOverlays(ctx, details, source, width, height, { hasLateralFrame = false, showEpi = true, showReba = true } = {}) {
  const canvas = { width, height };
    if (!details) return;
    const overlays = getFrameOverlayData(details, source, { hasLateralFrame });
    const frame = getIncidentFrameMetadata(details, source);
    const scaleX = frame?.width > 0 ? width / frame.width : 1;
    const scaleY = frame?.height > 0 ? height / frame.height : 1;
    const scaleBox = (bbox) => bbox?.map((coordinate, index) => coordinate * (index % 2 === 0 ? scaleX : scaleY));
    const scalePoints = (points) => points?.map(([x, y, ...rest]) => [x * scaleX, y * scaleY, ...rest]);

    const fontSize = Math.max(14, canvas.width * 0.018);
    ctx.font = `bold ${fontSize}px monospace`;

    // EPIs pertencentes à imagem desta câmera.
    if (showEpi) {
      overlays.epi.forEach(({ label, confidence, bbox }) => {
        if (!bbox || bbox.length < 4) return;
        const [x1, y1, x2, y2] = scaleBox(bbox);
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

    const tracking = showReba ? overlays.reba : [];
    tracking.forEach(({ pessoa_id, reba_score, reba_level, queda, bbox: originalBox, keypoints: originalPoints, confianca, confidence, confianca_deteccao }) => {
        const bbox = scaleBox(originalBox);
        const keypoints = scalePoints(originalPoints);
        const rebaColor = (reba_score ?? 0) >= 7 ? '#ef4444' : (reba_score ?? 0) >= 4 ? '#f59e0b' : '#10b981';

        // Desenha a Bounding Box da pessoa (Tracejada)
        if (bbox && bbox.length === 4) {
          const [x1, y1, x2, y2] = bbox;
          ctx.strokeStyle = rebaColor;
          ctx.lineWidth = Math.max(3, canvas.width * 0.004);
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
        const poseConfidence = normalizeConfidence(confianca ?? confidence ?? confianca_deteccao);
        const confidenceText = poseConfidence !== null ? ` • ${(poseConfidence * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '';
        const labelText = `ID ${pessoa_id ?? 0} • REBA ${reba_score ?? '?'} ${reba_level ?? ''}${confidenceText}${queda ? ' ⚠QUEDA' : ''}`;
        const tw = ctx.measureText(labelText).width;
        const labelX = Math.max(4, Math.min(anchorX, canvas.width - tw - 12));
        const labelY = Math.max(fontSize + 14, Math.min(anchorY, canvas.height - 8));
        
        ctx.fillStyle = rebaColor + 'ee';
        ctx.fillRect(labelX - 2, labelY - fontSize - 10, tw + 8, fontSize + 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, labelX + 2, labelY - 4);
      });

    // 3. DESENHO DA ZONA DE RISCO INVADIDA
    const zonaInvadida = getIncidentCameraDetails(details, source, { hasLateralFrame }).zona.find((z) => z.invadiu);
    const zonaConfig = zonaInvadida || details.zona_config;
    const zonePoints = zonaConfig?.source && zonaConfig.source !== source ? [] : (zonaConfig?.pontos || []).map(
      (point) => ({ x: point.x * scaleX, y: point.y * scaleY }),
    );
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

