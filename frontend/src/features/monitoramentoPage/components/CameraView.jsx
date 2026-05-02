import React, { useEffect, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';

const WS_URL = 'ws://localhost:8765';

export const CameraView = () => {
  const imgRef       = useRef(null);
  const wsRef        = useRef(null);
  const reconnectRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [uptime, setUptime]       = useState(0);

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
        if (imgRef.current) {
          imgRef.current.src = `data:image/jpeg;base64,${event.data}`;
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
  }, []);

  useEffect(() => {
    if (!connected) { setUptime(0); return; }
    const id = setInterval(() => setUptime((t) => t + 1), 1000);
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
      <div
        className="flex items-center px-4 gap-3"
        style={{ height: 42, background: '#141518', borderBottom: '1px solid #1e2025' }}
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

      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ height: 520, background: '#090a0c' }}
      >
        {[
          { top: 16, left: 16,    borderTop:    '1.5px solid #252830', borderLeft:   '1.5px solid #252830' },
          { top: 16, right: 16,   borderTop:    '1.5px solid #252830', borderRight:  '1.5px solid #252830' },
          { bottom: 16, left: 16,  borderBottom: '1.5px solid #252830', borderLeft:   '1.5px solid #252830' },
          { bottom: 16, right: 16, borderBottom: '1.5px solid #252830', borderRight:  '1.5px solid #252830' },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...s, zIndex: 10 }} />
        ))}

        {connected && (
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 1, zIndex: 20, pointerEvents: 'none',
            background: 'linear-gradient(90deg,transparent,rgba(60,200,122,0.15),transparent)',
            animation: 'scanline 4s linear infinite',
          }} />
        )}

        {!connected && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage:
              'linear-gradient(45deg,#131416 25%,transparent 25%),' +
              'linear-gradient(-45deg,#131416 25%,transparent 25%),' +
              'linear-gradient(45deg,transparent 75%,#131416 75%),' +
              'linear-gradient(-45deg,transparent 75%,#131416 75%)',
            backgroundSize: '18px 18px',
            backgroundPosition: '0 0,0 9px,9px -9px,-9px 0',
            backgroundColor: '#0d0e10',
          }} />
        )}

        <img
          ref={imgRef}
          alt=""
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            display: connected ? 'block' : 'none',
          }}
        />

        {!connected && (
          <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#2d3040', letterSpacing: '0.08em' }}>
              SEM SINAL
            </p>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#1e2229', marginTop: 6, letterSpacing: '0.06em' }}>
              {WS_URL}
            </p>
          </div>
        )}
      </div>

      <div
        className="flex items-center justify-between px-4"
        style={{ height: 44, background: '#141518', borderTop: '1px solid #1e2025' }}
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