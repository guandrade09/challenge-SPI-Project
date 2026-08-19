import React, { useEffect, useRef, useState, useCallback } from 'react';
import { QuedaModal } from './QuedaModal';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';

const WS_URL = 'ws://localhost:8765';

// Mapeia label do modelo → chave do toggle (para filtrar desenho no canvas)
const LABEL_TO_TOGGLE = {
  'AURICULAR - AUSENTE': 'auricular',
  'AURICULAR - CERTO':   'auricular',
  'AURICULAR - ERRADO':  'auricular',
  'BOTAS - AUSENTE':     'botas',
  'BOTAS - CERTO':       'botas',
  'CAPACETE - AUSENTE':  'capacete',
  'CAPACETE - CERTO':    'capacete',
  'CAPACETE - ERRADO':   'capacete',
  'COLETE - AUSENTE':    'colete',
  'COLETE - CERTO':      'colete',
  'MASCARA - AUSENTE':   'mascara',
  'MASCARA - CERTO':     'mascara',
  'MASCARA - ERRADO':    'mascara',
  'OCULOS - AUSENTE':    'oculos',
  'OCULOS - CERTO':      'oculos',
  'OCULOS - ERRADO':     'oculos',
  // PESSOA não tem toggle — sempre desenhada
};

// Classes de risco → caixa vermelha; correto → verde; pessoa → cinza
const LABEL_COLOR = (label) => {
  if (label === 'PESSOA') return '#5a5e7a';
  if (label.endsWith('- AUSENTE') || label.endsWith('- ERRADO')) return '#e05252';
  if (label.endsWith('- CERTO')) return '#3cc87a';
  return '#d4a017';
};

const SKELETON = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [5, 6],
  [5, 7], [7, 9],
  [6, 8], [8, 10],
  [5, 11], [6, 12],
  [11, 12],
  [11, 13], [13, 15],
  [12, 14], [14, 16],
];

const REBA_COLOR = {
  BAIXO: '#3cc87a',
  MÉDIO: '#d4a017',
  ALTO:  '#e05252',
};

const KP_MIN = 0.3;

function drawPessoa(ctx, pessoa) {
  const kps   = pessoa.keypoints ?? [];
  const color = REBA_COLOR[pessoa.reba_level] ?? '#ffffff';

  // Esqueleto
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2;
  for (const [a, b] of SKELETON) {
    const A = kps[a], B = kps[b];
    if (!A || !B || A[2] < KP_MIN || B[2] < KP_MIN) continue;
    ctx.beginPath();
    ctx.moveTo(A[0], A[1]);
    ctx.lineTo(B[0], B[1]);
    ctx.stroke();
  }

  // Pontos
  ctx.fillStyle = color;
  for (const kp of kps) {
    if (!kp || kp[2] < KP_MIN) continue;
    ctx.beginPath();
    ctx.arc(kp[0], kp[1], 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Badge REBA — só para MÉDIO e ALTO
  const score = pessoa.reba_score;
  const level = pessoa.reba_level;
  if (pessoa.bbox?.length === 4 && level && level !== 'BAIXO') {
    const [x1, y1] = pessoa.bbox;
    const label = `REBA ${score} · ${level}`;
    ctx.font = 'bold 11px "IBM Plex Mono", monospace';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = color;
    ctx.fillRect(x1, Math.max(0, y1 - 18), tw + 6, 16);
    ctx.fillStyle = '#000';
    ctx.fillText(label, x1 + 3, Math.max(13, y1 - 5));
  }
}

function b64ToBlob(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: 'image/jpeg' });
}

export const CameraView = ({ isMaximized = false }) => {
  const canvasRef        = useRef(null);
  const lateralCanvasRef = useRef(null);
  const wsRef        = useRef(null);
  const reconnectRef = useRef(null);
  const uptimeRef    = useRef(0);
  const rafRef       = useRef(null);
  const seqRef       = useRef(0);
  const seqLateralRef = useRef(0);

  const bitmapRef         = useRef(null);
  const bitmapLateralRef  = useRef(null);
  const epiDataRef  = useRef([]);
  const poseDataFrontalRef = useRef([]);
  const poseDataLateralRef = useRef([]);
  const [hasLateral, setHasLateral] = useState(false);
  const [mainSource, setMainSource] = useState('frontal'); // 'frontal' | 'lateral' — qual câmera aparece grande

  const [connected, setConnected] = useState(false);
  const [uptime, setUptimeDisplay] = useState(0);
  const [quedaAtiva, setQuedaAtiva] = useState(false);

  const addAlerta         = useMonitoramentoStore((s) => s.addAlerta);
  const setLiveDetections = useMonitoramentoStore((s) => s.setLiveDetections);
  const setVerdict        = useMonitoramentoStore((s) => s.setVerdict);
  const setMetrics        = useMonitoramentoStore((s) => s.setMetrics);
  const setLastFrame      = useMonitoramentoStore((s) => s.setLastFrame);

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmapRef.current) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const { detections: toggles } = useMonitoramentoStore.getState();

    ctx.drawImage(bitmapRef.current, 0, 0, W, H);

    // ── Bounding boxes EPI
    for (const det of epiDataRef.current) {
      const tk = LABEL_TO_TOGGLE[det.label];

      // PESSOA sempre desenha; EPIs só se o toggle estiver ativo
      if (tk && !toggles[tk]) continue;

      const color = LABEL_COLOR(det.label);
      const { x1, y1, x2, y2 } = det;

      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);


      const text = `${det.label}  ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 10px "IBM Plex Mono", monospace';
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = color;
      ctx.fillRect(x1, Math.max(0, y1 - 16), tw + 6, 16);
      ctx.fillStyle = '#000';
      ctx.fillText(text, x1 + 3, Math.max(12, y1 - 3));
    }

    // Pose de cada câmera é desenhada só no canvas dessa câmera — nunca mistura
    // detecção da lateral aparecendo na frontal (ou o contrário).
    if (toggles.ergonomia) {
      for (const p of poseDataFrontalRef.current) drawPessoa(ctx, p);
    }
  }, []);

  const drawLateral = useCallback(() => {
    const canvas = lateralCanvasRef.current;
    if (!canvas || !bitmapLateralRef.current) return;
    const ctx = canvas.getContext('2d');
    const { detections: toggles } = useMonitoramentoStore.getState();

    ctx.drawImage(bitmapLateralRef.current, 0, 0, canvas.width, canvas.height);

    if (toggles.ergonomia) {
      for (const p of poseDataLateralRef.current) drawPessoa(ctx, p);
    }
  }, []);

  const detections = useMonitoramentoStore((s) => s.detections);
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      drawAll();
      drawLateral();
    });
  }, [detections, drawAll, drawLateral]);

  useEffect(() => {
    function connect() {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'frame') {
            const seq = ++seqRef.current;
            const dataUrl = `data:image/jpeg;base64,${msg.data}`;
            setLastFrame(dataUrl);

            createImageBitmap(b64ToBlob(msg.data))
              .then((bitmap) => {
                if (seq !== seqRef.current) { bitmap.close(); return; }
                const canvas = canvasRef.current;
                if (!canvas) { bitmap.close(); return; }

                if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
                  canvas.width  = bitmap.width;
                  canvas.height = bitmap.height;
                }

                if (bitmapRef.current) bitmapRef.current.close();
                bitmapRef.current = bitmap;
                drawAll();
              })
              .catch(() => {});

          } else if (msg.type === 'frame_lateral') {
            setHasLateral(true);
            const seq = ++seqLateralRef.current;

            createImageBitmap(b64ToBlob(msg.data))
              .then((bitmap) => {
                if (seq !== seqLateralRef.current) { bitmap.close(); return; }
                const canvas = lateralCanvasRef.current;
                if (!canvas) { bitmap.close(); return; }

                if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
                  canvas.width  = bitmap.width;
                  canvas.height = bitmap.height;
                }

                if (bitmapLateralRef.current) bitmapLateralRef.current.close();
                bitmapLateralRef.current = bitmap;
                drawLateral();
              })
              .catch(() => {});

          } else if (msg.type === 'detections') {
            epiDataRef.current = msg.data ?? [];
            setLiveDetections(msg.data ?? []);

          } else if (msg.type === 'pose') {
            if (msg.source === 'lateral') {
              poseDataLateralRef.current = msg.pessoas ?? [];
            } else {
              poseDataFrontalRef.current = msg.pessoas ?? [];
            }

          } else if (msg.type === 'alert') {
            addAlerta(msg);

          } else if (msg.type === 'verdict') {
            setVerdict(msg);

          } else if (msg.type === 'metrics') {
            setMetrics(msg);
          } else if (msg.type === 'queda') {
            setQuedaAtiva(true);
          }
        } catch { /* ignorado */ }
      };

      ws.onerror = () => {};

      ws.onclose = () => {
        setConnected(false);
        setHasLateral(false);
        const canvas = canvasRef.current;
        if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        if (bitmapRef.current) { bitmapRef.current.close(); bitmapRef.current = null; }
        if (bitmapLateralRef.current) { bitmapLateralRef.current.close(); bitmapLateralRef.current = null; }
        reconnectRef.current = setTimeout(connect, 3000);
      };
    }

    connect();
    return () => {
      clearTimeout(reconnectRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
      if (bitmapRef.current) { bitmapRef.current.close(); bitmapRef.current = null; }
      if (bitmapLateralRef.current) { bitmapLateralRef.current.close(); bitmapLateralRef.current = null; }
    };
  }, [addAlerta, setLiveDetections, setVerdict, setMetrics, setLastFrame, drawAll, drawLateral]);

  useEffect(() => {
    if (!connected) { uptimeRef.current = 0; return; }
    uptimeRef.current = 0;
    const id = setInterval(() => {
      uptimeRef.current += 1;
      setUptimeDisplay(uptimeRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [connected]);

  const fmt = (s) => [
    String(Math.floor(s / 3600)).padStart(2, '0'),
    String(Math.floor((s % 3600) / 60)).padStart(2, '0'),
    String(s % 60).padStart(2, '0'),
  ].join(':');

  const frontalIsMain = mainSource === 'frontal' || !hasLateral;
  const PIP_STYLE = {
    big: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    pip: {
      position: 'absolute', bottom: 14, right: 14, zIndex: 15,
      width: '30%', maxWidth: 220, aspectRatio: '4/3', objectFit: 'cover',
      borderRadius: 8, display: 'block', cursor: 'pointer',
      border: '1.5px solid var(--p-accent, #3cc87a)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    },
  };

  return (
    <>
      {quedaAtiva && <QuedaModal onClose={() => setQuedaAtiva(false)} />}
      <div className="panel-base min-h-0 flex flex-col w-full h-full text-[var(--p-text)] transition-colors duration-300">
        <div className={`relative flex items-center justify-center overflow-hidden bg-[var(--p-graf-bg)] transition-all duration-300 ${
          isMaximized ? 'flex-1 h-full min-h-[400px]' : 'h-[520px]'
        }`}>
          {[
            'top-4 left-4 border-t-2 border-l-2',
            'top-4 right-4 border-t-2 border-r-2',
            'bottom-4 left-4 border-b-2 border-l-2',
            'bottom-4 right-4 border-b-2 border-r-2',
          ].map((classes, i) => (
            <div
              key={i}
              className={`absolute w-5 h-5 z-10 pointer-events-none transition-colors duration-300 ${
                connected ? 'border-[var(--p-subtext)]' : 'border-[var(--p-border)]'
              } ${classes}`}
            />
          ))}

          {connected && (
            <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--p-subtext)] to-transparent z-20 pointer-events-none animate-[scanline_4s_linear_infinite]" />
          )}

          {!connected && (
            <div
              className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, var(--p-text) 25%, transparent 25%),
                  linear-gradient(-45deg, var(--p-text) 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, var(--p-text) 75%),
                  linear-gradient(-45deg, transparent 75%, var(--p-text) 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0'
              }}
            />
          )}

          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className={`select-none transition-opacity duration-300 ${connected ? 'opacity-100' : 'opacity-0'}`}
            style={frontalIsMain ? PIP_STYLE.big : PIP_STYLE.pip}
            onClick={() => hasLateral && !frontalIsMain && setMainSource('frontal')}
          />

          {!connected && (
            <div className="relative z-10 text-center select-none p-6 rounded-xl bg-[var(--p-bg)] border border-[var(--p-border)] shadow-xl backdrop-blur-sm">
              <p className="font-mono text-xs font-bold tracking-widest text-[var(--p-text)] animate-pulse">
                SEM SINAL TRANSMISSÃO
              </p>
              <p className="font-mono text-[10px] text-[var(--p-text)] opacity-60 mt-2 truncate max-w-xs px-2">
                {WS_URL}
              </p>
            </div>
          )}

          {hasLateral && (
            <>
              <canvas
                ref={lateralCanvasRef}
                width={640}
                height={480}
                style={{ ...(!frontalIsMain ? PIP_STYLE.big : PIP_STYLE.pip), background: '#090a0c' }}
                onClick={() => frontalIsMain && setMainSource('lateral')}
              />
              <span style={{
                position: 'absolute',
                ...(frontalIsMain
                  ? { bottom: 20, right: 24 }
                  : { top: 20, left: 24 }),
                zIndex: 16, pointerEvents: 'none',
                fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#fff',
                letterSpacing: '0.06em', textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              }}>
                {frontalIsMain ? 'lateral · toque p/ ampliar' : 'frontal · toque p/ ampliar'}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between p-4 font-mono text-xs shrink-0 border-t border-[var(--p-border)] bg-[var(--p-header-bg)] transition-colors duration-300">
          <span className="font-medium text-[var(--p-text)]">
            {connected ? (
              <span className="text-[var(--p-subtext)] font-bold">
                {fmt(uptime)}{' '}
                <span className="font-normal opacity-60 text-[var(--p-text)]">· online</span>
              </span>
            ) : (
              <span className="opacity-60 text-[var(--p-text)]">--:--:-- · offline</span>
            )}
          </span>

          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide select-none">
            <span
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                connected
                  ? 'bg-[var(--p-subtext)] shadow-[0_0_10px_var(--p-subtext)] animate-pulse'
                  : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
              }`}
            />
            <span className={connected ? 'text-[var(--p-subtext)] font-bold' : 'text-amber-500 font-bold'}>
              {connected ? 'conectado' : 'aguardando'}
            </span>
          </div>
        </div>

        <style>{`
          @keyframes scanline {
            0%   { top: 0; opacity: 0; }
            5%   { opacity: 1; }
            95%  { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `}</style>
      </div>
    </>
  );
};

export default CameraView;
