import React, { useEffect } from 'react';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cameraSocketManager } from '../../services/websocket/CameraSocketManager';
import { useCameraPresetsStore } from '../../store/useCameraPresetsStore';
import { useCameraStreamStore } from '../../store/useCameraStreamStore';

const normalizeCameraId = (cameraId) => {
  if (typeof cameraId === 'string' && /^cam_\d+$/.test(cameraId)) {
    return Number(cameraId.slice(4));
  }
  return cameraId;
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'agora';
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString('pt-BR');
};

export function GlobalFallAlert() {
  const navigate = useNavigate();
  const fallAlert = useCameraStreamStore((state) => state.fallAlertQueue[0] || null);
  const dismissFallAlert = useCameraStreamStore((state) => state.dismissFallAlert);
  const setLastCameraId = useCameraPresetsStore((state) => state.setLastCameraId);

  useEffect(() => {
    cameraSocketManager.subscribe({ frames: false });
    return () => cameraSocketManager.unsubscribe({ frames: false });
  }, []);

  if (!fallAlert) return null;

  const handleGoToCamera = () => {
    const cameraId = normalizeCameraId(fallAlert.camera_id ?? fallAlert.cameraId);
    if (cameraId !== null && cameraId !== undefined && cameraId !== '') {
      setLastCameraId(cameraId);
    }
    dismissFallAlert(fallAlert.event_id);
    navigate('/camera');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" role="presentation">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fall-alert-title"
        aria-describedby="fall-alert-description"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-400/60 bg-slate-950 text-white shadow-[0_0_70px_rgba(239,68,68,0.35)]"
      >
        <div className="h-1.5 w-full animate-pulse bg-red-500" />
        <button
          type="button"
          onClick={() => dismissFallAlert(fallAlert.event_id)}
          className="absolute right-3 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Fechar alerta de queda"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 ring-1 ring-red-400/40">
            <AlertTriangle className="h-8 w-8 animate-pulse text-red-400" />
          </div>
          <p className="mb-1 font-mono text-xs font-bold uppercase tracking-[0.2em] text-red-400">Alerta crítico</p>
          <h2 id="fall-alert-title" className="text-2xl font-black tracking-tight">Queda detectada</h2>
          <p id="fall-alert-description" className="mt-3 text-sm leading-6 text-slate-300">
            Foi identificada uma possível queda no setor <strong className="text-white">{fallAlert.setor || 'não informado'}</strong>.
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Câmera</dt>
              <dd className="mt-1 font-semibold">{fallAlert.camera_id ?? fallAlert.cameraId ?? 'não informada'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Horário</dt>
              <dd className="mt-1 font-semibold">{formatTimestamp(fallAlert.timestamp)}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={handleGoToCamera}
            autoFocus
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            IR <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
}

export default GlobalFallAlert;
