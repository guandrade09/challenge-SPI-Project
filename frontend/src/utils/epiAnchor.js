// Ancora as caixas de EPI na pose, para elas andarem junto com a pessoa.
//
// Por quê: o EPI roda ~4x/s e, na fila da GPU, fica atrás da pose — a caixa chega
// descrevendo um frame de ~65–300ms atrás e fica para trás quando a pessoa se mexe. A pose
// chega ~7x/s e quase sem atraso. Então: o EPI diz O QUÊ (sem capacete, sem colete...) e a
// pose diz ONDE.
//
// Como: o orquestrador manda o instante do frame analisado pelo EPI (captured_at). Pegamos
// a pose desse mesmo instante (histórico curto), achamos de quem é cada caixa e guardamos
// a distância da caixa até a parte do corpo dela (cabeça para capacete/máscara/óculos/
// protetor auricular, tronco para colete, pés para botas). A cada pose nova, a caixa é
// desenhada na posição atual dessa parte do corpo. Sem pose correspondente, a caixa fica
// onde o EPI viu (comportamento antigo). Tudo em pixels do FRAME.

import { headPoint } from './faceIdentity.js';

export const POSE_HISTORY_MS = 1500;
const MAX_SNAPSHOT_GAP_S = 0.3;   // pose mais distante que isso do instante do EPI não serve
const TRACK_RADIUS = 150;         // quanto o ponto de referência anda entre duas poses (px)
const BOX_MARGIN = 0.2;           // folga na caixa da pessoa para aceitar o EPI como dela

const KP_CONF_MIN = 0.3;
const visible = (kp) => kp && (kp[2] ?? kp.conf ?? 1) >= KP_CONF_MIN;
const point = (kp) => ({ x: kp[0] ?? kp.x, y: kp[1] ?? kp.y });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function meanOf(keypoints, indexes) {
  const pts = indexes.map((i) => keypoints?.[i]).filter(visible).map(point);
  if (pts.length === 0) return null;
  return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length };
}

const torso = (kps) => meanOf(kps, [5, 6, 11, 12]);
// Ponto usado para seguir a pessoa de uma pose para a outra.
const trackPointOf = (kps) => torso(kps) ?? headPoint(kps);

const HEAD_EPIS = ['CAPACETE', 'MASCARA', 'MÁSCARA', 'OCULOS', 'ÓCULOS', 'AURICULAR'];

// Parte do corpo onde cada EPI fica. Sem a parte visível, usa o tronco/cabeça.
export function anchorFor(label, keypoints) {
  const L = (label || '').toUpperCase();
  if (HEAD_EPIS.some((h) => L.startsWith(h))) return headPoint(keypoints) ?? torso(keypoints);
  if (L.startsWith('BOTA')) return meanOf(keypoints, [15, 16]) ?? meanOf(keypoints, [13, 14]) ?? torso(keypoints);
  if (L.startsWith('LUVA')) return meanOf(keypoints, [9, 10]) ?? torso(keypoints);
  return torso(keypoints) ?? headPoint(keypoints);
}

function personBox(keypoints) {
  const pts = (keypoints || []).filter(visible).map(point);
  if (pts.length === 0) return null;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const [x1, x2, y1, y2] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const mx = (x2 - x1) * BOX_MARGIN + 20;
  const my = (y2 - y1) * BOX_MARGIN + 20;
  return { x1: x1 - mx, y1: y1 - my, x2: x2 + mx, y2: y2 + my };
}

// Pessoa (índice) dona da caixa: a que contém o centro da caixa e cujo ponto de âncora está
// mais perto dele.
function ownerOf(det, pessoas) {
  const c = { x: (det.x1 + det.x2) / 2, y: (det.y1 + det.y2) / 2 };
  let best = null;
  pessoas.forEach((p, i) => {
    const box = personBox(p.keypoints);
    if (!box || c.x < box.x1 || c.x > box.x2 || c.y < box.y1 || c.y > box.y2) return;
    const anchor = anchorFor(det.label, p.keypoints);
    if (!anchor) return;
    const d = dist(anchor, c);
    if (!best || d < best.d) best = { i, d, anchor };
  });
  return best;
}

function nearestPerson(ref, pessoas) {
  let best = null;
  pessoas.forEach((p, i) => {
    const tp = trackPointOf(p.keypoints);
    if (!tp) return;
    const d = dist(tp, ref);
    if (d <= TRACK_RADIUS && (!best || d < best.d)) best = { i, d, tp };
  });
  return best;
}

/**
 * Move cada rastro para a pose atual. Rastro sem âncora (ou que perdeu a pessoa) devolve a
 * caixa como o EPI viu.
 * @returns {tracks, boxes}  boxes no mesmo formato das detecções ({label, confidence, x1..y2})
 */
export function placeEpiTracks(tracks, pessoas) {
  const updated = tracks.map((t) => {
    if (!t.offset || !t.trackPoint) return t;
    const found = nearestPerson(t.trackPoint, pessoas);
    if (!found) return { ...t, current: null };
    const anchor = anchorFor(t.det.label, pessoas[found.i].keypoints);
    if (!anchor) return { ...t, trackPoint: found.tp, current: null };
    return {
      ...t,
      trackPoint: found.tp,
      current: {
        x1: anchor.x + t.offset.x1, y1: anchor.y + t.offset.y1,
        x2: anchor.x + t.offset.x2, y2: anchor.y + t.offset.y2,
      },
    };
  });
  const boxes = updated.map((t) => ({ ...t.det, ...(t.current ?? {}) }));
  return { tracks: updated, boxes };
}

/**
 * Cria os rastros a partir de uma detecção nova: ancora cada caixa na pose do mesmo
 * instante do EPI e avança pelo histórico até a pose mais recente.
 * @param history  [{capturedAt (s), pessoas}] em ordem de chegada
 */
export function buildEpiTracks(detections, detCapturedAt, history) {
  let snapIdx = -1;
  if (detCapturedAt && history.length) {
    let bestGap = Infinity;
    history.forEach((h, i) => {
      const gap = Math.abs(h.capturedAt - detCapturedAt);
      if (gap < bestGap) { bestGap = gap; snapIdx = i; }
    });
    if (bestGap > MAX_SNAPSHOT_GAP_S) snapIdx = -1;
  }
  let tracks = detections.map((det) => {
    if (snapIdx < 0) return { det, offset: null, trackPoint: null, current: null };
    const pessoas = history[snapIdx].pessoas;
    const owner = ownerOf(det, pessoas);
    if (!owner) return { det, offset: null, trackPoint: null, current: null };
    return {
      det,
      offset: { x1: det.x1 - owner.anchor.x, y1: det.y1 - owner.anchor.y,
                x2: det.x2 - owner.anchor.x, y2: det.y2 - owner.anchor.y },
      trackPoint: trackPointOf(pessoas[owner.i].keypoints),
      current: null,
    };
  });
  // Avança pose a pose até a atual (passos pequenos = seguir a pessoa sem trocar).
  let boxes = tracks.map((t) => t.det);
  const start = snapIdx < 0 ? history.length : snapIdx; // sem pose do instante: não ancora
  for (let j = start; j < history.length; j++) {
    ({ tracks, boxes } = placeEpiTracks(tracks, history[j].pessoas));
  }
  return { tracks, boxes };
}
