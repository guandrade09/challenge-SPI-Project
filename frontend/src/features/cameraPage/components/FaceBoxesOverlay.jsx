import React, { useState } from 'react';
import { makeStreamKey, useCameraStreamStore } from '../../../store/useCameraStreamStore';
import { useElementSize } from '../../../hooks/useElementSize';
import { getCoverTransform, frameToContainer } from '../../../utils/coverTransform';

// Desenha a caixa + nome do reconhecimento facial (ver ml_facial/face_recognizer.py e
// orquestrador/main.py#_run_facial_sector) por cima do vídeo, no mesmo padrão visual do
// DetectionsOverlay (EPI).
export function FaceBoxesOverlay({ cameraId, setor, visible = true }) {
  const faces = useCameraStreamStore((s) => s.getFaces(cameraId, setor));
  // Seletores primitivos, não o objeto inteiro: getFacesMeta() monta um objeto NOVO a cada
  // chamada, então usá-lo direto como valor selecionado faria o Zustand comparar por
  // referência e re-renderizar este componente a cada frame de vídeo que chega pelo
  // WebSocket (dezenas de vezes por segundo) — foi isso que travava a página.
  const facesKey = makeStreamKey(cameraId, setor, 'facial');
  const faceFrameWidthRaw = useCameraStreamStore((s) => s.faces[facesKey]?.frameWidth);
  const faceFrameHeightRaw = useCameraStreamStore((s) => s.faces[facesKey]?.frameHeight);
  const metaWidth = useCameraStreamStore((s) => s.getFrameMeta(cameraId, setor, 'frontal')?.width);
  const metaHeight = useCameraStreamStore((s) => s.getFrameMeta(cameraId, setor, 'frontal')?.height);
  const frameWidth = metaWidth || 640;
  const frameHeight = metaHeight || 480;

  const [containerEl, setContainerEl] = useState(null);
  const { width: containerW, height: containerH } = useElementSize(containerEl);
  const transform = getCoverTransform(containerW, containerH, frameWidth, frameHeight);

  if (!visible || faces.length === 0) return null;

  const faceFrameWidth = faceFrameWidthRaw || frameWidth;
  const faceFrameHeight = faceFrameHeightRaw || frameHeight;
  const scaleX = frameWidth / faceFrameWidth;
  const scaleY = frameHeight / faceFrameHeight;

  return (
    <div ref={setContainerEl} className="absolute inset-0 pointer-events-none overflow-hidden z-20 select-none">
      {transform && faces.map((face, idx) => {
        const x1 = face.x1 * scaleX;
        const y1 = face.y1 * scaleY;
        const x2 = face.x2 * scaleX;
        const y2 = face.y2 * scaleY;

        const topLeft = frameToContainer(transform, x1, y1);
        const width = Math.max(0, (x2 - x1) * transform.scale);
        const height = Math.max(0, (y2 - y1) * transform.scale);

        const reconhecido = face.reconhecido ?? (face.funcionario_id !== null && face.funcionario_id !== undefined);
        const borderColor = reconhecido
          ? 'border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
          : 'border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
        const tagBg = reconhecido ? 'bg-emerald-600/90 text-white' : 'bg-amber-600/90 text-white';

        return (
          <div
            key={`face-${idx}`}
            style={{
              left: `${topLeft.x}px`,
              top: `${topLeft.y}px`,
              width: `${width}px`,
              height: `${height}px`,
            }}
            className={`absolute border-2 rounded-sm transition-all duration-100 ${borderColor}`}
          >
            <div className={`absolute -top-4 left-0 px-1.5 py-0.2 rounded font-mono text-[9px] font-bold uppercase tracking-wider whitespace-nowrap backdrop-blur-sm ${tagBg}`}>
              {face.nome}{face.confidence ? ` ${Math.round(face.confidence * 100)}%` : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default FaceBoxesOverlay;
