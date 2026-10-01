import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { makeStreamKey, useCameraStreamStore } from '../../../store/useCameraStreamStore';
import { cameraSocketManager } from '../../../services/websocket/CameraSocketManager';

export function MosaicCameraItem({ cam, isActive, onClick }) {
  const [reconnectError, setReconnectError] = useState('');
  const setor = cam?.setor;
  const source = cam?.papel || 'frontal';

  // Assina o WebSocket gerenciado (compartilha a mesma conexão global)
  useEffect(() => {
    cameraSocketManager.subscribe();
    return () => cameraSocketManager.unsubscribe();
  }, []);

  const frameUrl = useCameraStreamStore((s) => s.getFrame(cam?.id, setor, source));
  const wsConnected = useCameraStreamStore((s) => s.connected);
  const streamStatus = useCameraStreamStore((s) => s.streamStatus[makeStreamKey(cam?.id, setor, source)]);
  const connected = wsConnected && !!frameUrl;
  const isReconnecting = streamStatus?.status === 'reconnecting';

  const handleReconnect = async (event) => {
    event.stopPropagation();
    if (cam?.id === null || cam?.id === undefined || isReconnecting) return;
    setReconnectError('');
    try {
      await cameraSocketManager.reconnectStream({ cameraId: cam.id, setor, source });
    } catch (error) {
      setReconnectError(error.message || 'Falha ao reconectar');
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative w-full aspect-video rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 select-none bg-neutral-900 group ${
        isActive
          ? 'border-[var(--p-subtext)] shadow-[0_0_15px_rgba(0,0,0,0.5)] ring-2 ring-[var(--p-subtext)]'
          : 'border-[var(--p-border)] opacity-85 hover:opacity-100 hover:border-[var(--p-subtext)]/60'
      }`}
    >
      {connected && frameUrl ? (
        <img
          key={`${cam?.id}:${setor}:${source}`}
          src={frameUrl}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-0 opacity-100"
          alt=""
        />
      ) : null}

      {!connected && (
        <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center bg-neutral-900 z-0 px-3">
          <span className="font-mono text-[10px] text-neutral-500 uppercase font-bold tracking-widest text-center">
            {isReconnecting ? 'RECONECTANDO...' : 'SEM SINAL'}
          </span>
          <button
            type="button"
            onClick={handleReconnect}
            disabled={!wsConnected || isReconnecting}
            className="relative z-30 px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 text-white font-mono text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${isReconnecting ? 'animate-spin' : ''}`} />
            Tentar novamente
          </button>
          {reconnectError && <span className="text-[8px] text-red-400 text-center">{reconnectError}</span>}
        </div>
      )}

      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />

      <div className="absolute top-2 left-2.5 right-2.5 flex items-center justify-between gap-2 z-20">
        <span className="font-bold text-xs truncate text-white drop-shadow-md tracking-wide">
          {cam?.nome || cam?.setor || 'Câmera'}
        </span>
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-300 border border-black/40 ${
            connected
              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]'
              : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
          }`}
        />
      </div>

      <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center justify-between z-20">
        <span className="font-mono text-[9px] font-medium text-white/80 drop-shadow-sm tracking-wider">
          {cam?.ip || '0.0.0.0'}
        </span>
      </div>
    </div>
  );
}

export default MosaicCameraItem;
