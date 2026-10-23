// Liga o reconhecimento facial às pessoas da pose, para mostrar o nome na etiqueta do REBA
// em vez de desenhar uma caixa no rosto.
//
// Por quê: o facial é o último da fila da GPU e chega ~1x/s, descrevendo um frame de
// ~0,5s atrás. A caixa ficava "fantasma" no lugar onde a pessoa estava. A pose chega
// ~7x/s e quase sem atraso, então: o facial diz QUEM é, a pose diz ONDE está.
//
// Como: quando chega um reconhecimento novo, cada rosto vai para a cabeça (pose) mais
// próxima da caixa dele. Entre um reconhecimento e outro, o nome segue a cabeça mais
// próxima da posição anterior. Sem nova confirmação do facial por FACE_TRACK_TTL_MS, expira.
// Tudo em pixels do FRAME.

const KP_CONF_MIN = 0.3;
const HEAD_KEYPOINTS = [0, 1, 2, 3, 4]; // nariz, olhos, orelhas (COCO)
export const FACE_TRACK_TTL_MS = 4000;

const kpConf = (kp) => kp[2] ?? kp.conf ?? 1;
const kpX = (kp) => kp[0] ?? kp.x;
const kpY = (kp) => kp[1] ?? kp.y;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Centro da cabeça: média dos keypoints visíveis do rosto. null se nenhum visível.
export function headPoint(keypoints) {
  const visible = HEAD_KEYPOINTS.map((i) => keypoints?.[i]).filter((kp) => kp && kpConf(kp) >= KP_CONF_MIN);
  if (visible.length === 0) return null;
  return {
    x: visible.reduce((sum, kp) => sum + kpX(kp), 0) / visible.length,
    y: visible.reduce((sum, kp) => sum + kpY(kp), 0) / visible.length,
  };
}

// Pareamento guloso pelo menor par (item, cabeça) dentro do limite de distância de cada item.
function pairNearest(items, heads, maxDistOf) {
  const candidates = [];
  items.forEach((item, i) => {
    heads.forEach((head, j) => {
      if (!head) return;
      const d = dist(item, head);
      if (d <= maxDistOf(item)) candidates.push({ i, j, d });
    });
  });
  candidates.sort((a, b) => a.d - b.d);
  const usedItems = new Set();
  const usedHeads = new Set();
  const pairs = [];
  for (const { i, j } of candidates) {
    if (usedItems.has(i) || usedHeads.has(j)) continue;
    usedItems.add(i);
    usedHeads.add(j);
    pairs.push({ item: items[i], headIdx: j });
  }
  return { pairs, unmatched: items.filter((_, i) => !usedItems.has(i)) };
}

const identityKey = (face) => (face.reconhecido ? `id:${face.funcionario_id ?? face.nome}` : null);
const facePairRadius = (face) => Math.max(60, 2.5 * face.w);   // caixa do rosto pode estar ~0,5s velha
const trackFollowRadius = (track) => Math.max(80, 3 * track.w); // quanto a cabeça anda entre poses

/**
 * @param prevTracks  rastros anteriores ([{nome, reconhecido, funcionario_id, x, y, w, confirmedAt}])
 * @param heads       centro da cabeça de cada pessoa da pose atual (null se não visível), mesma ordem da pose
 * @param faces       rostos do último reconhecimento ([{nome, reconhecido, funcionario_id, cx, cy, w}])
 * @param facesIsNew  true se `faces` acabou de chegar (ainda não foi usado para criar rastros)
 * @returns {tracks, byHead: Map(headIdx → track), unmatchedFaces}
 */
export function updateFaceTracks(prevTracks, { heads, faces, facesIsNew, now }) {
  let tracks = prevTracks.filter((t) => now - t.confirmedAt <= FACE_TRACK_TTL_MS);
  let unmatchedFaces = null;

  if (facesIsNew) {
    const located = faces.map((f) => ({ ...f, x: f.cx, y: f.cy }));
    const { pairs, unmatched } = pairNearest(located, heads, facePairRadius);
    const fresh = pairs.map(({ item, headIdx }) => ({
      nome: item.nome, reconhecido: item.reconhecido, funcionario_id: item.funcionario_id,
      x: heads[headIdx].x, y: heads[headIdx].y, w: item.w, confirmedAt: now,
    }));
    const freshKeys = new Set(fresh.map(identityKey).filter(Boolean));
    // Rastro antigo da mesma pessoa (mesma identidade ou mesma cabeça) é substituído.
    tracks = [
      ...fresh,
      ...tracks.filter((t) => !freshKeys.has(identityKey(t)) && !fresh.some((f) => dist(f, t) < trackFollowRadius(t))),
    ];
    unmatchedFaces = unmatched;
  }

  // Cada rastro acompanha a cabeça mais próxima da posição anterior.
  const { pairs } = pairNearest(tracks, heads, trackFollowRadius);
  const byHead = new Map();
  const moved = new Map();
  for (const { item, headIdx } of pairs) {
    const updated = { ...item, x: heads[headIdx].x, y: heads[headIdx].y };
    moved.set(item, updated);
    byHead.set(headIdx, updated);
  }
  return { tracks: tracks.map((t) => moved.get(t) ?? t), byHead, unmatchedFaces };
}
