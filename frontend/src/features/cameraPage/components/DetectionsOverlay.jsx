import React, { useMemo, useState } from 'react';
import { makeStreamKey, useCameraStreamStore } from '../../../store/useCameraStreamStore';
import { isMissingEpiDetection } from '../../../utils/epiConfig';
import { useElementSize } from '../../../hooks/useElementSize';
import { getCoverTransform, frameToContainer } from '../../../utils/coverTransform';
import { formatLiveIncidentLabel } from '../../../utils/liveIncidentLabels';

const EMPTY_LIST = Object.freeze([]);
// Largura aproximada de um caractere monospace em fontSize 9 (para dimensionar a etiqueta).
const TAG_CHAR_W = 5.6;

export function DetectionsOverlay({ cameraId, setor, source = 'frontal', visible = true }) {
  const rawDetections = useCameraStreamStore((s) => s.getDetections(cameraId, setor, source));
  const detections = useMemo(
    () => rawDetections.filter(isMissingEpiDetection),
    [rawDetections]
  );
  const poseData = useCameraStreamStore((s) => s.getPose(cameraId, setor, source));
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

  // Reconhecimento facial: vira nome na etiqueta do REBA (ligação rosto ↔ pessoa da pose
  // feita no store, ver utils/faceIdentity.js), sem caixa no rosto.
  const faceIdentity = useCameraStreamStore((s) => s.faceIdentity[makeStreamKey(cameraId, setor, source)]);
  const nomesPorPessoa = faceIdentity?.byPose || EMPTY_LIST;
  const rostosSemPose = faceIdentity?.semPose || EMPTY_LIST;

  if (!visible) return null;

  return (
    <div ref={setContainerEl} className="absolute inset-0 pointer-events-none overflow-hidden z-20 select-none">
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
            const pessoaFace = nomesPorPessoa[pIdx];
            const nomeTag = pessoaFace ? (pessoaFace.reconhecido ? pessoaFace.nome : 'Desconhecido') : null;
            const rebaTag = pessoa.queda
              ? 'Queda'
              : formatLiveIncidentLabel(`reba_${pessoa.reba_level || 'baixo'}_${pessoa.reba_score ?? 1}`);
            const tagText = nomeTag ? `${nomeTag} · ${rebaTag}` : rebaTag;
            const tagWidth = Math.max(90, tagText.length * TAG_CHAR_W + 16);
            // Etiqueta acima do topo da cabeça, não na testa: sobe proporcional ao tamanho da
            // cabeça na tela (distância entre as orelhas, ou entre os olhos x2), para ficar
            // certa com a pessoa perto ou longe da câmera.
            const visivel = (kp) => kp && (kp[2] ?? kp.conf ?? 1) >= 0.3;
            const [, , , orelhaE, orelhaD] = keypoints;
            const [, olhoE, olhoD] = keypoints;
            const larguraCabeca = transform && visivel(orelhaE) && visivel(orelhaD)
              ? Math.abs(toContainer(orelhaE).x - toContainer(orelhaD).x)
              : transform && visivel(olhoE) && visivel(olhoD)
              ? Math.abs(toContainer(olhoE).x - toContainer(olhoD).x) * 2
              : 0;
            const tagOffsetY = Math.max(28, larguraCabeca * 1.3);

            return (
              <g key={`person-${pIdx}`}>
                {/* Só os pontos das articulações, sem as linhas do esqueleto: deixa a
                    imagem mais limpa. Sem as linhas, a cor do REBA vai no preenchimento. */}
                {keypoints.map((kp, kpIdx) => {
                  if (!kp || (kp[2] ?? kp.conf ?? 1) < 0.3) return null;
                  const p = toContainer(kp);
                  return (
                    <circle
                      key={`kp-${pIdx}-${kpIdx}`}
                      cx={p.x}
                      cy={p.y}
                      r="6"
                      fill={rebaColor}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* Tag de REBA sobre a cabeça */}
                {headKp && (headKp[2] ?? headKp.conf ?? 1) >= 0.3 && (
                  <g transform={`translate(${toContainer(headKp).x}, ${Math.max(20, toContainer(headKp).y - tagOffsetY)})`}>
                    <rect
                      x={-tagWidth / 2}
                      y="-14"
                      width={tagWidth}
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
                      {nomeTag && (
                        <tspan fill={pessoaFace.reconhecido ? '#34d399' : '#fbbf24'}>{`${nomeTag} · `}</tspan>
                      )}
                      <tspan>{rebaTag}</tspan>
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      )}

      {/* Rostos reconhecidos sem pose correspondente (ver faceIdentity.semPose no store) */}
      {rostosSemPose.length > 0 && (
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {rostosSemPose.map((face, fIdx) => (
            <div
              key={`face-chip-${fIdx}`}
              className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold whitespace-nowrap backdrop-blur-sm ${
                face.reconhecido ? 'bg-emerald-600/90 text-white' : 'bg-amber-600/90 text-white'
              }`}
            >
              {face.reconhecido ? `${face.nome} está aqui` : 'Rosto desconhecido'}
            </div>
          ))}
        </div>
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
                className={`absolute -top-4 left-0 px-1.5 py-0.2 rounded font-mono text-[9px] font-bold whitespace-nowrap backdrop-blur-sm ${tagBg}`}
              >
                {formatLiveIncidentLabel(det.label)} {det.confidence ? `${Math.round(det.confidence * 100)}%` : ''}
              </div>
            </div>
          );
        })}
    </div>
  );
}

export default DetectionsOverlay;
