import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2 } from 'lucide-react';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';

const WS_URL = 'ws://localhost:8765';

// Mapa label EPI → chave do toggle no store
const LABEL_TO_TOGGLE = {
  'Hardhat':        'capacete',
  'NO-Hardhat':     'capacete',
  'Safety Vest':    'colete',
  'NO-Safety Vest': 'colete',
  'Goggles':        'oculos',
  'NO-Goggles':     'oculos',
  'Mask':           'mascara',
  'NO-Mask':        'mascara',
};

// Conexões do skeleton COCO (17 keypoints)
const SKELETON = [
  [0, 1], [0, 2], [1, 3], [2, 4],          // cabeça
  [5, 6],                                    // ombros
  [5, 7], [7, 9],                            // braço esq
  [6, 8], [8, 10],                           // braço dir
  [5, 11], [6, 12],                          // torso
  [11, 12],                                  // quadris
  [11, 13], [13, 15],                        // perna esq
  [12, 14], [14, 16],                        // perna dir
];

const CLASSE_COLOR = {
  adequada:                   '#3cc87a',
  ergonomicamente_inadequada: '#d4a017',
  risco_imediato:             '#e05252',
};

const CLASSE_PT = {
  adequada:                   'Adequada',
  ergonomicamente_inadequada: 'Postura Inadequada',
  risco_imediato:             'Risco Imediato',
};

const KP_CONF_MIN = 0.3;

function drawPessoa(ctx, pessoa) {
  const kps   = pessoa.keypoints ?? [];
  const color = CLASSE_COLOR[pessoa.classe] ?? '#ffffff';

  // Linhas do skeleton
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2;
  for (const [a, b] of SKELETON) {
    const kpA = kps[a];
    const kpB = kps[b];
    if (!kpA || !kpB || kpA[2] < KP_CONF_MIN || kpB[2] < KP_CONF_MIN) continue;
    ctx.beginPath();
    ctx.moveTo(kpA[0], kpA[1]);
    ctx.lineTo(kpB[0], kpB[1]);
    ctx.stroke();
  }

  // Pontos dos keypoints
  ctx.fillStyle = color;
  for (const kp of kps) {
    if (!kp || kp[2] < KP_CONF_MIN) continue;
    ctx.beginPath();
    ctx.arc(kp[0], kp[1], 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Label de classificação acima da bbox
  if (pessoa.bbox?.length === 4 && pessoa.classe !== 'adequada') {
    const [x1, y1] = pessoa.bbox;
    const text = CLASSE_PT[pessoa.classe] ?? pessoa.classe;
    ctx.font = 'bold 11px "IBM Plex Mono", monospace';
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = color;
    ctx.fillRect(x1, Math.max(0, y1 - 18), tw + 6, 16);
    ctx.fillStyle = '#000';
    ctx.fillText(text, x1 + 3, Math.max(13, y1 - 5));
  }
}

export const CameraView = () => {
  const canvasRef    = useRef(null);
  const wsRef        = useRef(null);
  const reconnectRef = useRef(null);
  const uptimeRef    = useRef(0);

  // Dados de desenho em refs — sem causar re-render
  const frameImgRef = useRef(null);
  const epiDataRef  = useRef([]);   // [{label, confidence, x1, y1, x2, y2}, ...]
  const poseDataRef = useRef([]);   // ergo_pessoas com keypoints

  const [connected, setConnected] = useState(false);
  const [uptime, setUptimeDisplay] = useState(0);

  const addAlerta         = useMonitoramentoStore((s) => s.addAlerta);
  const setLiveDetections = useMonitoramentoStore((s) => s.setLiveDetections);
  const setVerdict        = useMonitoramentoStore((s) => s.setVerdict);
  const setMetrics        = useMonitoramentoStore((s) => s.setMetrics);
  const setLastFrame      = useMonitoramentoStore((s) => s.setLastFrame);

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Lê toggles diretamente do store (imperativo — não reativo)
    const { detections: toggles } = useMonitoramentoStore.getState();

    ctx.clearRect(0, 0, W, H);

    // 1. Frame
    if (frameImgRef.current) {
      ctx.drawImage(frameImgRef.current, 0, 0, W, H);
    }

    // 2. Bounding boxes de EPI filtradas pelos toggles
    for (const det of epiDataRef.current) {
      const toggleKey = LABEL_TO_TOGGLE[det.label];
      if (toggleKey && !toggles[toggleKey]) continue;

      const isRisk = det.label.startsWith('NO-');
      const color  = isRisk ? '#ff4444' : '#3cc87a';
      const { x1, y1, x2, y2 } = det;

      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // Label com fundo colorido
      const text = `${det.label}  ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 11px "IBM Plex Mono", monospace';
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = color;
      ctx.fillRect(x1, Math.max(0, y1 - 16), tw + 6, 16);
      ctx.fillStyle = '#000';
      ctx.fillText(text, x1 + 3, Math.max(12, y1 - 3));
    }

    // 3. Skeleton de pose (se toggle ergonomia ligado)
    if (toggles.ergonomia) {
      for (const pessoa of poseDataRef.current) {
        drawPessoa(ctx, pessoa);
      }
    }
  }, []);

  // Redesenha quando o usuário altera um toggle
  const detections = useMonitoramentoStore((s) => s.detections);
  useEffect(() => {
    drawAll();
  }, [detections, drawAll]);

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
            const dataUrl = `data:image/jpeg;base64,${msg.data}`;
            setLastFrame(dataUrl);
            const img = new Image();
            img.onload = () => {
              // Sincroniza dimensões do canvas com o frame recebido
              const canvas = canvasRef.current;
              if (canvas && (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight)) {
                canvas.width  = img.naturalWidth;
                canvas.height = img.naturalHeight;
              }
              frameImgRef.current = img;
              drawAll();
            };
            img.src = dataUrl;

          } else if (msg.type === 'detections') {
            epiDataRef.current = msg.data ?? [];
            setLiveDetections(msg.data ?? []);
            drawAll();

          } else if (msg.type === 'pose') {
            poseDataRef.current = msg.pessoas ?? [];
            drawAll();

          } else if (msg.type === 'alert') {
            addAlerta(msg);

          } else if (msg.type === 'verdict') {
            setVerdict(msg);

          } else if (msg.type === 'metrics') {
            setMetrics(msg);
          }
        } catch {
          // ignorado
        }
      };

      ws.onerror = () => {};

      ws.onclose = () => {
        setConnected(false);
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
        frameImgRef.current = null;
        reconnectRef.current = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [addAlerta, setLiveDetections, setVerdict, setMetrics, setLastFrame, drawAll]);

  useEffect(() => {
    if (!connected) {
      uptimeRef.current = 0;
      return;
    }
    uptimeRef.current = 0;
    const id = setInterval(() => {
      uptimeRef.current += 1;
      setUptimeDisplay(uptimeRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [connected]);

  const formatUptime = (s) => {
    const h   = String(Math.floor(s / 3600)).padStart(2, '0');
    const m   = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  return (
    <div
      className="w-full flex flex-col overflow-hidden rounded-xl shadow-2xl"
      style={{ border: '1px solid #1e2025', background: '#0d0e10' }}
    >
      {/* Barra superior */}
      <div
        className="flex items-center px-4 gap-3"
        style={{ height: 42, background: '#141518', borderBottom: '1px solid #1e2025', flexShrink: 0 }}
      >
        <div className="flex gap-1.5">
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#e05252' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#d4a017' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#3cc87a' }} />
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#4a4e5a', letterSpacing: '0.04em', marginLeft: 6 }}>
          câmera ao vivo
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
            background: connected ? '#3cc87a' : '#d4a017',
            boxShadow: connected ? '0 0 0 3px rgba(60,200,122,0.18)' : '0 0 0 3px rgba(212,160,23,0.18)',
          }} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#4a4e5a', letterSpacing: '0.06em' }}>
            {connected ? 'conectado' : 'aguardando'}
          </span>
        </div>
      </div>

      {/* Área de vídeo — aspect ratio 4:3 para alinhar com frames 640×480 */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '4/3', background: '#090a0c' }}
      >
        {/* Cantos decorativos */}
        {[
          { top: 16, left: 16,    borderTop:    '1.5px solid #252830', borderLeft:   '1.5px solid #252830' },
          { top: 16, right: 16,   borderTop:    '1.5px solid #252830', borderRight:  '1.5px solid #252830' },
          { bottom: 16, left: 16,  borderBottom: '1.5px solid #252830', borderLeft:   '1.5px solid #252830' },
          { bottom: 16, right: 16, borderBottom: '1.5px solid #252830', borderRight:  '1.5px solid #252830' },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...s, zIndex: 10, pointerEvents: 'none' }} />
        ))}

        {connected && (
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 1, zIndex: 20, pointerEvents: 'none',
            background: 'linear-gradient(90deg,transparent,rgba(60,200,122,0.15),transparent)',
            animation: 'scanline 4s linear infinite',
          }} />
        )}

        {/* Placeholder sem sinal */}
        {!connected && (
          <>
            <div style={{
              position: 'absolute', inset: 0, zIndex: 5,
              backgroundImage:
                'linear-gradient(45deg,#131416 25%,transparent 25%),' +
                'linear-gradient(-45deg,#131416 25%,transparent 25%),' +
                'linear-gradient(45deg,transparent 75%,#131416 75%),' +
                'linear-gradient(-45deg,transparent 75%,#131416 75%)',
              backgroundSize: '18px 18px',
              backgroundPosition: '0 0,0 9px,9px -9px,-9px 0',
              backgroundColor: '#0d0e10',
            }} />
            <div style={{
              position: 'absolute', inset: 0, zIndex: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#2d3040', letterSpacing: '0.08em' }}>
                  SEM SINAL
                </p>
                <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#1e2229', marginTop: 6, letterSpacing: '0.06em' }}>
                  {WS_URL}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Canvas principal — desenha frame + overlays */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        />
      </div>

      {/* Barra inferior */}
      <div
        className="flex items-center justify-between px-4"
        style={{ height: 44, background: '#141518', borderTop: '1px solid #1e2025', flexShrink: 0 }}
      >
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#2d3040', letterSpacing: '0.06em' }}>
          {connected ? `${formatUptime(uptime)} · online` : '-- · offline'}
        </span>
        <button style={{
          width: 30, height: 30, borderRadius: 6,
          background: '#1a1c21', border: '1px solid #252830',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#5a5e6a', cursor: 'pointer',
        }}>
          <Maximize2 size={13} />
        </button>
      </div>

      <style>{`
        @keyframes scanline {
          0%   { top: 0;    opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CameraView;
