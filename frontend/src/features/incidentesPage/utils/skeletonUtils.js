// src/features/incidentesPage/utils/skeletonUtils.js
export const KP_CONF_THRESHOLD = 0.4;
export const SKELETON_EDGES = [
  [0,1],[0,2],[1,3],[2,4],
  [5,6],
  [5,7],[7,9],[6,8],[8,10],
  [5,11],[6,12],[11,12],
  [11,13],[13,15],[12,14],[14,16],
];

export function drawSkeleton(ctx, keypoints, rebaColor) {
  if (!keypoints || keypoints.length < 17) return;

  ctx.lineWidth = 2;
  SKELETON_EDGES.forEach(([a, b]) => {
    const kpA = keypoints[a];
    const kpB = keypoints[b];
    if (!kpA || !kpB) return;
    if (kpA[2] < KP_CONF_THRESHOLD || kpB[2] < KP_CONF_THRESHOLD) return;
    ctx.strokeStyle = rebaColor + 'cc';
    ctx.beginPath();
    ctx.moveTo(kpA[0], kpA[1]);
    ctx.lineTo(kpB[0], kpB[1]);
    ctx.stroke();
  });

  keypoints.forEach(([x, y, conf]) => {
    if (conf < KP_CONF_THRESHOLD) return;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rebaColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}