import React, { useMemo, useState } from 'react';
import { useCameraStreamStore } from '../../../store/useCameraStreamStore';
import { isMissingEpiDetection } from '../../../utils/epiConfig';
import { useElementSize } from '../../../hooks/useElementSize';
import { getCoverTransform, frameToContainer } from '../../../utils/coverTransform';

// Conexões do esqueleto COCO (pares de índices de keypoints)
const SKELETON_CONNECTIONS = [
  [0, 1], [0, 2], [1, 3], [2, 4],       // Cabeça
  [5, 6],                               // Ombros
  [5, 7], [7, 9],                       // Braço esquerdo
  [6, 8], [8, 10],                      // Braço direito
  [5, 11], [6, 12], [11, 12],           // Tronco
  [11, 13], [13, 15],                   // Perna esquerda
  [12, 14], [14, 16],                   // Perna direita
];
const EMPTY_ARRAY = Object.freeze([]);

export function DetectionsOverlay({ cameraId, setor, source = 'frontal', visible = true }) {
  const rawDetections = useCameraStreamStore((s) => s.getDetections(cameraId, setor, source));
  const detections = useMemo(
    () => rawDetections.filter(isMissingEpiDetection),
    [rawDetections]
  );
  const poseData = useCameraStreamStore((s) => {
    const p = s.pose[setor];
    if (!p) return EMPTY_ARRAY;
    if (Array.isArray(p)) return p;
    return p[source] || p.frontal || EMPTY_ARRAY;
  });
  const verdict = useCameraStreamStore((s) => s.verdict[setor] || null);
  // seletores primitivos: o objeto de meta é recriado a cada frame e re-renderizaria sempre
  const metaWidth = useCameraStreamStore((s) => s.getFrameMeta(cameraId, setor, source)?.width);
  const metaHeight = useCameraStreamStore((s) => s.getFrameMeta(cameraId, setor, source)?.height);
  const frameWidth = metaWidth || 640;
  const frameHeight = metaHeight || 480;

  // As coordenadas das caixas/keypoints são pixels do FRAME; o <img> usa object-cover, que
  // escala e corta o frame para preencher o container. A mesma transformação do cover é
  // aplicada aqui (e na área de risco) para o overlay ficar exatamente sobre a imagem.
  const [containerEl, setContainerEl] = useState(null);
  const { width: containerW, height: containerH } = useElementSize(containerEl);
  const transform = getCoverTransform(containerW, containerH, frameWidth, frameHeight);
  // só é chamado dentro de blocos protegidos por `transform` não nulo
  const toContainer = (kp) => frameToContainer(transform, kp[0] ?? kp.x, kp[1] ?? kp.y);

  if (!visible) return null;

  const isCritical = verdict?.status === 'ALERTA_CRITICO' || verdict?.status === 'ALERTA_MULTIPLO';
  const isAlert = verdict?.status === 'ALERTA' || isCritical;

  return (
    <div ref={setContainerEl} className="absolute inset-0 pointer-events-none overflow-hidden z-20 select-none">
      {/* ── 1. BADGE DE STATUS / VEREDITO NO TOPO ── */}
      {verdict && (
        <div className="absolute top-10 left-2 z-30 flex items-center gap-1.5 pointer-events-auto">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase backdrop-blur-md border shadow-lg transition-all duration-300 ${
              isCritical
                ? 'bg-red-600/90 border-red-400 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.7)]'
                : isAlert
                ? 'bg-amber-600/90 border-amber-400 text-white'
                : 'bg-black/60 border-emerald-500/50 text-emerald-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCritical
                  ? 'bg-white animate-ping'
                  : isAlert
                  ? 'bg-amber-300 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span>{verdict.status || 'MONITORANDO'}</span>
            {verdict.reasons?.length > 0 && (
              <span className="opacity-90 font-normal text-[10px] lowercase text-white/90">
                ({verdict.reasons.join(', ')})
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── 2. SVG OVERLAY PARA POSE / ESQUELETO ERGONÔMICO ── */}
      {transform && poseData.length > 0 && (
        <svg
          viewBox={`0 0 ${containerW} ${containerH}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {poseData.map((pessoa, pIdx) => {
            const keypoints = pessoa.keypoints || [];
            if (keypoints.length === 0) return null;

            const rebaColor =
              pessoa.reba_level === 'ALTO'
                ? '#ef4444' // vermelho
                : pessoa.reba_level === 'MÉDIO'
                ? '#f59e0b' // amarelo
                : '#10b981'; // verde

            // Cabeça/nariz (kp 0) para ancorar o badge de REBA
            const headKp = keypoints[0];

            return (
              <g key={`person-${pIdx}`}>
                {/* Linhas do esqueleto */}
                {SKELETON_CONNECTIONS.map(([i, j], lineIdx) => {
                  const kp1 = keypoints[i];
                  const kp2 = keypoints[j];
                  if (!kp1 || !kp2 || (kp1[2] ?? kp1.conf ?? 1) < 0.3 || (kp2[2] ?? kp2.conf ?? 1) < 0.3) {
                    return null;
                  }
                  const p1 = toContainer(kp1);
                  const p2 = toContainer(kp2);
                  return (
                    <line
                      key={`line-${pIdx}-${lineIdx}`}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={rebaColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeOpacity="0.8"
                    />
                  );
                })}

                {/* Pontos das articulações */}
                {keypoints.map((kp, kpIdx) => {
                  if (!kp || (kp[2] ?? kp.conf ?? 1) < 0.3) return null;
                  const p = toContainer(kp);
                  return (
                    <circle
                      key={`kp-${pIdx}-${kpIdx}`}
                      cx={p.x}
                      cy={p.y}
                      r="3.5"
                      fill="#ffffff"
                      stroke={rebaColor}
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* Tag de REBA sobre a cabeça */}
                {headKp && (headKp[2] ?? headKp.conf ?? 1) >= 0.3 && (
                  <g transform={`translate(${toContainer(headKp).x}, ${Math.max(20, toContainer(headKp).y - 15)})`}>
                    <rect
                      x="-45"
                      y="-14"
                      width="90"
                      height="16"
                      rx="4"
                      fill="rgba(0,0,0,0.75)"
                      stroke={rebaColor}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="-3"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {pessoa.queda
                        ? 'QUEDA!'
                        : `REBA: ${pessoa.reba_score ?? 1} (${pessoa.reba_level || 'OK'})`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      )}

      {/* ── 3. BOUNDING BOXES DE EPIS (DETECTADOS) ── */}
      {transform && detections.length > 0 &&
        detections.map((det, dIdx) => {
          const isAbsent = det.label.includes('AUSENTE') || det.label.includes('ERRADO');
          const isPresent = det.label.includes('PRESENTE') || det.label.includes('CERTO');

          // pixels do frame → pixels do container (mesma transformação do object-cover)
          const topLeft = frameToContainer(transform, det.x1, det.y1);
          const left = topLeft.x;
          const top = topLeft.y;
          const width = Math.max(0, (det.x2 - det.x1) * transform.scale);
          const height = Math.max(0, (det.y2 - det.y1) * transform.scale);

          const borderColor = isAbsent
            ? 'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
            : isPresent
            ? 'border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
            : 'border-blue-500';

          const tagBg = isAbsent
            ? 'bg-red-600/90 text-white'
            : isPresent
            ? 'bg-emerald-600/90 text-white'
            : 'bg-blue-600/90 text-white';

          return (
            <div
              key={`det-${dIdx}`}
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
              }}
              className={`absolute border-2 rounded-sm transition-all duration-100 ${borderColor}`}
            >
              {/* Tag com Nome e Confiança */}
              <div
                className={`absolute -top-4 left-0 px-1.5 py-0.2 rounded font-mono text-[9px] font-bold uppercase tracking-wider whitespace-nowrap backdrop-blur-sm ${tagBg}`}
              >
                {det.label} {det.confidence ? `${Math.round(det.confidence * 100)}%` : ''}
              </div>
            </div>
          );
        })}
    </div>
  );
}

export default DetectionsOverlay;
