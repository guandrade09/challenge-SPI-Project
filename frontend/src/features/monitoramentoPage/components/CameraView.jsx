import React, { useEffect, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { useMonitoramentoStore } from '../../../store/useMonitoramentoStore';

const WS_URL = 'ws://localhost:8765';

// Corner brackets for camera overlay
const CORNER_STYLES = [
  { top: 16, left: 16,    borderTop:    '1.5px solid #252830', borderLeft:   '1.5px solid #252830' },
  { top: 16, right: 16,   borderTop:    '1.5px solid #252830', borderRight:  '1.5px solid #252830' },
  { bottom: 16, left: 16,  borderBottom: '1.5px solid #252830', borderLeft:   '1.5px solid #252830' },
  { bottom: 16, right: 16, borderBottom: '1.5px solid #252830', borderRight:  '1.5px solid #252830' },
];

export const CameraView = () => {
  const imgRef       = useRef(null);
  const wsRef        = useRef(null);
  const reconnectRef = useRef(null);
  const uptimeRef    = useRef(0);

  const [connected, setConnected]   = useState(false);
  const [uptime, setUptimeDisplay]  = useState(0);

  const addAlerta        = useMonitoramentoStore((s) => s.addAlerta);
  const setLiveDetections = useMonitoramentoStore((s) => s.setLiveDetections);

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
          if (msg.type === 'frame' && imgRef.current) {
            imgRef.current.src = `data:image/jpeg;base64,${msg.data}`;
          } else if (msg.type === 'alert') {
            addAlerta(msg);
          } else if (msg.type === 'detections') {
            setLiveDetections(msg.data);
          }
        } catch {
          // ignorado
        }
      };

      ws.onerror = () => {};
      ws.onclose = () => {
        setConnected(false);
        if (imgRef.current) imgRef.current.src = '';
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
  }, [addAlerta, setLiveDetections]);

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

  const dotColor    = connected ? '#3cc87a' : '#d4a017';
  const dotShadow   = connected ? '0 0 0 3px rgba(60,200,122,0.18)' : '0 0 0 3px rgba(212,160,23,0.18)';
  const statusLabel = connected ? 'conectado' : 'aguardando';

  return (
    <div className="camera-container">
      {/* Header */}
      <div className="camera-header">
        <div className="flex gap-1.5">
          {['#e05252', '#d4a017', '#3cc87a'].map((c, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <span className="label-mono text-[11px] ml-1.5">câmera ao vivo</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="status-dot" style={{ background: dotColor, boxShadow: dotShadow }} />
          <span className="label-mono">{statusLabel}</span>
        </div>
      </div>

      {/* Feed */}
      <div className="relative flex items-center justify-center overflow-hidden" style={{ height: 520, background: '#090a0c' }}>
        {CORNER_STYLES.map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...s, zIndex: 10 }} />
        ))}

        {connected && (
          <div
            className="absolute left-0 right-0 h-px z-20 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg,transparent,rgba(60,200,122,0.15),transparent)',
              animation: 'scanline 4s linear infinite',
            }}
          />
        )}

        {!connected && (
          <div
            style={{
              position: 'absolute', inset: 0,
              backgroundImage:
                'linear-gradient(45deg,#131416 25%,transparent 25%),' +
                'linear-gradient(-45deg,#131416 25%,transparent 25%),' +
                'linear-gradient(45deg,transparent 75%,#131416 75%),' +
                'linear-gradient(-45deg,transparent 75%,#131416 75%)',
              backgroundSize: '18px 18px',
              backgroundPosition: '0 0,0 9px,9px -9px,-9px 0',
              backgroundColor: '#0d0e10',
            }}
          />
        )}

        <img
          ref={imgRef}
          alt=""
          className="w-full h-full object-cover"
          style={{ display: connected ? 'block' : 'none' }}
        />

        {!connected && (
          <div className="relative z-10 text-center">
            <p className="label-mono text-[12px]" style={{ color: '#2d3040' }}>SEM SINAL</p>
            <p className="label-mono" style={{ color: '#1e2229', marginTop: 6 }}>{WS_URL}</p>
          </div>
        )}
      </div>

      {/* Trailer */}
      <div className="camera-trailer">
        <span className="label-mono" style={{ color: '#2d3040' }}>
          {connected ? `${formatUptime(uptime)} · online` : '-- · offline'}
        </span>
        <button className="btn-icon-action">
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