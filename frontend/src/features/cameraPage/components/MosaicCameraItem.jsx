import React, { useEffect, useRef, useState } from 'react';
import { processWsStreamMessage } from '../../../utils/websocketStream';

const WS_URL = 'ws://127.0.0.1:8765';

export function MosaicCameraItem({ cam, isActive, onClick }) {
  const imgRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastImgUrlRef = useRef(null);
  const camRef = useRef(cam);

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    camRef.current = cam;
  }, [cam]);

  // Limpa imagem se trocar a câmera do card
  useEffect(() => {
    setConnected(false);
    if (imgRef.current) imgRef.current.src = '';
    if (lastImgUrlRef.current) {
      URL.revokeObjectURL(lastImgUrlRef.current);
      lastImgUrlRef.current = null;
    }
  }, [cam?.id, cam?.ip]);

  useEffect(() => {
    let isMounted = true;

    function resetFrameTimeout() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (isMounted) {
          setConnected(false);
          if (imgRef.current) imgRef.current.src = '';
        }
      }, 2500);
    }

    function connect() {
      if (wsRef.current) {
        const old = wsRef.current;
        old.onclose = null;
        if (old.readyState !== WebSocket.CONNECTING) old.close();
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onmessage = async (event) => {
        const streamData = await processWsStreamMessage(event, camRef.current);

        if (streamData && isMounted) {
          resetFrameTimeout();
          setConnected(true);

          if (imgRef.current) {
            if (lastImgUrlRef.current) URL.revokeObjectURL(lastImgUrlRef.current);
            lastImgUrlRef.current = streamData.imageUrl;
            imgRef.current.src = streamData.imageUrl;
          }
        }
      };

      ws.onclose = () => {
        if (isMounted) {
          setConnected(false);
          if (imgRef.current) imgRef.current.src = '';
          reconnectRef.current = setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (wsRef.current) wsRef.current.close();
      if (lastImgUrlRef.current) URL.revokeObjectURL(lastImgUrlRef.current);
    };
  }, [cam?.id, cam?.ip]);

  return (
    <div
      onClick={onClick}
      className={`relative w-full aspect-video rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 select-none bg-neutral-900 group ${
        isActive
          ? 'border-[var(--p-subtext)] shadow-[0_0_15px_rgba(0,0,0,0.5)] ring-2 ring-[var(--p-subtext)]'
          : 'border-[var(--p-border)] opacity-85 hover:opacity-100 hover:border-[var(--p-subtext)]/60'
      }`}
    >
      {/* Stream preenchendo 100% do card */}
      <img
        ref={imgRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-0 ${
          connected ? 'opacity-100' : 'opacity-0'
        }`}
        alt=""
      />

      {/* Fallback visual quando offline */}
      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 z-0">
          <span className="font-mono text-[10px] text-neutral-500 uppercase font-bold tracking-widest">
            {cam?.setor || cam?.nome || 'OFFLINE'}
          </span>
        </div>
      )}

      {/* Gradientes de sombra para garantir legibilidade dos textos sobre a imagem */}
      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />

      {/* Header sobreposto (Nome da Câmera / Setor + Status Indicator) */}
      <div className="absolute top-2 left-2.5 right-2.5 flex items-center justify-between gap-2 z-20">
        <span className="font-bold text-xs truncate text-white drop-shadow-md tracking-wide">
          {cam?.setor || cam?.nome || 'Câmera'}
        </span>
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-300 border border-black/40 ${
            connected
              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]'
              : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
          }`}
        />
      </div>

      {/* Footer sobreposto (IP da Câmera) */}
      <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center justify-between z-20">
        <span className="font-mono text-[9px] font-medium text-white/80 drop-shadow-sm tracking-wider">
          {cam?.ip || '0.0.0.0'}
        </span>
      </div>
    </div>
  );
}

export default MosaicCameraItem;