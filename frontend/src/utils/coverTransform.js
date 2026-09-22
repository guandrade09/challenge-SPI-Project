// Transformação do `object-fit: cover` (object-position centralizado, o padrão do
// `object-cover` do Tailwind) entre o espaço do FRAME (pixels da imagem real) e o espaço do
// CONTAINER (pixels na tela). Toda a UI que desenha sobre o vídeo (caixas, esqueleto, área
// de risco) deve usar estas funções, para ficar exatamente sobre o que aparece na imagem.
//
//   scale   = max(containerW / frameW, containerH / frameH)   ← o lado "sobrando" é cortado
//   offsetX = (containerW - frameW * scale) / 2               ← ≤ 0: crop horizontal
//   offsetY = (containerH - frameH * scale) / 2               ← ≤ 0: crop vertical

export function getCoverTransform(containerW, containerH, frameW, frameH) {
  if (!(containerW > 0 && containerH > 0 && frameW > 0 && frameH > 0)) return null;
  const scale = Math.max(containerW / frameW, containerH / frameH);
  return {
    scale,
    offsetX: (containerW - frameW * scale) / 2,
    offsetY: (containerH - frameH * scale) / 2,
    frameW,
    frameH,
    containerW,
    containerH,
  };
}

// pixel do frame → pixel do container
export function frameToContainer(t, x, y) {
  return { x: t.offsetX + x * t.scale, y: t.offsetY + y * t.scale };
}

// pixel do container → pixel do frame (pode cair fora de [0, frame] se o ponto estiver na área cortada)
export function containerToFrame(t, x, y) {
  return { x: (x - t.offsetX) / t.scale, y: (y - t.offsetY) / t.scale };
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// pixel do container → % do frame (0..100), limitado ao frame
export function containerToFramePercent(t, x, y) {
  const p = containerToFrame(t, x, y);
  return {
    x: clamp((p.x / t.frameW) * 100, 0, 100),
    y: clamp((p.y / t.frameH) * 100, 0, 100),
  };
}

// % do frame → pixel do container
export function framePercentToContainer(t, xPercent, yPercent) {
  return frameToContainer(t, (xPercent / 100) * t.frameW, (yPercent / 100) * t.frameH);
}

// retângulo em % do frame {x,y,width,height} → retângulo em pixels do container
export function frameBoxToContainerRect(t, box) {
  const topLeft = framePercentToContainer(t, box.x, box.y);
  return {
    left: topLeft.x,
    top: topLeft.y,
    width: (box.width / 100) * t.frameW * t.scale,
    height: (box.height / 100) * t.frameH * t.scale,
  };
}
