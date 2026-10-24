import React from 'react';

// Cor por tipo de detecção: risco (AUSENTE/ERRADO) em vermelho, pessoa em azul, EPI ok em verde
function boxColor(label = '') {
  if (/AUSENTE|ERRADO/i.test(label)) return '#ef4444';
  if (/^PESSOA/i.test(label)) return '#38bdf8';
  return '#22c55e';
}

const FONT_SIZE = 13;
const LABEL_H = 18;
const CHAR_W = 7.4;

/**
 * Desenha as caixas do detector (x1,y1,x2,y2 em pixels do frame) sobre o <img>.
 * O SVG usa viewBox = tamanho real do frame + preserveAspectRatio="slice", que se comporta
 * como o `object-cover` do <img>: as caixas continuam alinhadas com a imagem em qualquer
 * tamanho de tela, inclusive fullscreen, sem precisar medir o container.
 */
export const DetectionBoxesOverlay = ({ boxes, frameSize }) => {
  if (!frameSize?.w || !frameSize?.h || !boxes?.length) return null;

  return (
    <svg
      viewBox={`0 0 ${frameSize.w} ${frameSize.h}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full z-20 pointer-events-none"
    >
      {boxes.map((b, i) => {
        const color = boxColor(b.label);
        const w = Math.max(0, b.x2 - b.x1);
        const h = Math.max(0, b.y2 - b.y1);
        const text = `${b.label} ${Math.round((b.confidence ?? 0) * 100)}%`;
        const textW = text.length * CHAR_W + 8;
        // etiqueta acima da caixa; se não couber (topo do frame), fica dentro dela
        const labelY = b.y1 - LABEL_H >= 0 ? b.y1 - LABEL_H : b.y1;

        return (
          <g key={`${b.label}-${i}`}>
            <rect
              x={b.x1}
              y={b.y1}
              width={w}
              height={h}
              fill="none"
              stroke={color}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
            <rect x={b.x1} y={labelY} width={textW} height={LABEL_H} fill={color} opacity={0.9} />
            <text
              x={b.x1 + 4}
              y={labelY + LABEL_H - 5}
              fill="#fff"
              fontSize={FONT_SIZE}
              fontFamily="monospace"
              fontWeight="bold"
            >
              {text}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default DetectionBoxesOverlay;
