import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';

// Captura fotos da webcam do computador para o cadastro facial. Entrega cada foto como
// data URL JPEG — o mesmo formato das fotos escolhidas por arquivo (fileToBase64), então o
// backend recebe igual. A prévia é espelhada (como um espelho, mais natural para se
// posicionar), mas a foto salva NÃO: é a imagem real, como as câmeras de monitoramento veem.
export function WebcamCapture({ onCapture, onClose, remaining, disabled = false }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('iniciando'); // iniciando | pronta | erro
  const [erro, setErro] = useState('');
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let stream = null;
    let cancelado = false;

    async function abrir() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('erro');
        setErro('Este navegador não permite acessar a câmera nesta página.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus('pronta');
      } catch (err) {
        if (cancelado) return;
        setStatus('erro');
        setErro(
          err?.name === 'NotAllowedError'
            ? 'Permissão da câmera negada. Libere o acesso à câmera no navegador e tente de novo.'
            : err?.name === 'NotFoundError'
            ? 'Nenhuma câmera encontrada neste computador.'
            : err?.name === 'NotReadableError'
            ? 'A câmera está em uso por outro programa.'
            : 'Não foi possível abrir a câmera.'
        );
      }
    }

    abrir();
    return () => {
      cancelado = true;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const tirarFoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || remaining <= 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL('image/jpeg', 0.92));
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  };

  return (
    <div className="w-full rounded-lg border border-theme-divider bg-[var(--p-bg)] p-2 flex flex-col gap-2">
      <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover -scale-x-100"
        />
        {flash && <div className="absolute inset-0 bg-white/70 pointer-events-none" />}
        {status === 'iniciando' && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-white text-xs">
            <Loader2 size={14} className="animate-spin" /> Abrindo câmera...
          </div>
        )}
        {status === 'erro' && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-red-300 text-xs">
            {erro}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-theme-muted text-[10px] font-theme-body">
          {remaining > 0 ? `Pode tirar mais ${remaining} foto${remaining > 1 ? 's' : ''}.` : 'Limite de fotos atingido.'}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1.5 rounded-md border border-theme-divider text-theme-main text-xs flex items-center gap-1 hover:border-[var(--p-subtext)] transition-colors"
          >
            <X size={12} /> Fechar câmera
          </button>
          <button
            type="button"
            onClick={tirarFoto}
            disabled={disabled || status !== 'pronta' || remaining <= 0}
            className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-600 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Camera size={12} /> Tirar foto
          </button>
        </div>
      </div>
    </div>
  );
}

export default WebcamCapture;
