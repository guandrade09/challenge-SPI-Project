// src/features/monitoramentoPage/components/ButtonEditCam.jsx
import React, { useState, useEffect } from 'react';
import { Pencil, Loader2, X, Save } from 'lucide-react';
import { PopupModal, IconButtonModal } from '../../../components/shared';

export function ButtonEditCam({
  camera,
  cameras = [],
  theme = "dynamic",
  onEditCamera,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState('');
  const [ip, setIp] = useState('');
  const [papel, setPapel] = useState('frontal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Outra câmera no mesmo setor já ocupa o papel frontal
  const setorJaTemFrontal = camera
    ? cameras.some((c) => c.id !== camera.id && c.setor?.trim().toLowerCase() === setor.trim().toLowerCase() && c.papel === 'frontal')
    : false;

  // Preenche o formulário com os dados atuais da câmera sempre que ela mudar ou o modal abrir
  useEffect(() => {
    if (!camera) return;
    setNome(camera.nome ?? '');
    setSetor(camera.setor ?? '');
    setIp(camera.streamUrl ?? camera.ip ?? '');
    setPapel(camera.papel ?? 'frontal');
  }, [camera, isOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
  };

  const handleOpen = (e) => {
    if (e) e.stopPropagation();
    setIsOpen(true);
  };

  // Aceita URL completa (rtsp:// ou http(s)://, ex: app IP Webcam do celular) ou um IP
  // puro (aí assume RTSP com o path padrão da Yoosee, que é o mais comum aqui).
  const resolveIpAndStream = (raw) => {
    const trimmed = raw.trim();
    if (trimmed.startsWith('rtsp://') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const hostMatch = trimmed.match(/@?([\d.]+)(?::\d+)?/);
      return { ip: hostMatch ? hostMatch[1] : trimmed, streamUrl: trimmed };
    }
    const resolvedIp = trimmed || camera?.ip || "192.168.1.100";
    return { ip: resolvedIp, streamUrl: `rtsp://${resolvedIp}:554/live/ch0` };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!camera?.id || !nome.trim() || !setor.trim()) return;

    setIsSubmitting(true);

    const { ip: resolvedIp, streamUrl } = resolveIpAndStream(ip);

    const updatedCamData = {
      ...camera,
      nome: nome.trim(),
      setor: setor.trim(),
      ip: resolvedIp,
      streamUrl,
      papel,
    };

    try {
      if (onEditCamera) {
        await onEditCamera(camera.id, updatedCamData);
      }
      setIsOpen(false);
    } catch (err) {
      console.error("Erro ao atualizar câmera:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <IconButtonModal
        title="Editar câmera"
        label=""
        icon={Pencil}
        onClick={handleOpen}
        variant="panel-btn-toggle"
        colorVariant="default"
        className={`p-1.5 ${className}`}
      />

      <PopupModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Editar Câmera"
        icon={Pencil}
        maxWidth="max-w-lg"
        theme={theme}
        className="text-(var[--p-text])"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium">Nome da Câmera</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Pátio Externo"
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium">Setor</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              placeholder="Ex: Logística"
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium">Endereço IP ou URL RTSP</label>
            <input
              type="text"
              disabled={isSubmitting}
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.100 ou http://192.168.1.100:8080/video ou rtsp://admin:senha@192.168.1.100:554/onvif1"
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium">Papel na Unidade de Detecção</label>
            {setorJaTemFrontal ? (
              <p className="text-[10px] mb-2 text-amber-400">
                Este setor já tem outra câmera frontal. Esta só pode ser lateral.
              </p>
            ) : (
              <p className="text-theme-muted text-[10px] mb-2">
                Frontal roda a detecção de EPI. Lateral roda ergonomia/zona de risco.
              </p>
            )}
            <div className="flex gap-2">
              {[
                { value: 'frontal', label: 'Frontal (EPI)' },
                { value: 'lateral', label: 'Lateral (Ergonomia/Zona)' },
              ].map((opt) => {
                const bloqueado = opt.value === 'frontal' && setorJaTemFrontal;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isSubmitting || bloqueado}
                    onClick={() => !bloqueado && setPapel(opt.value)}
                    title={bloqueado ? 'Este setor já tem uma câmera frontal' : undefined}
                    className={`flex-1 p-2 rounded-lg border text-xs transition-colors ${
                      bloqueado
                        ? 'border-theme-divider text-theme-muted opacity-40 cursor-not-allowed'
                        : papel === opt.value
                          ? 'border-[var(--p-subtext)] text-[var(--p-subtext)] bg-[var(--p-subtext)]/10'
                          : 'border-theme-divider text-theme-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-theme-divider">
            <IconButtonModal
              tipo="button"
              icon={X}
              onClick={handleClose}
              label="Cancelar"
              colorVariant="cancel"
              variant="full"
            />
            <IconButtonModal
              tipo="submit"
              icon={isSubmitting ? Loader2 : Save}
              label={isSubmitting ? "Salvando..." : "Salvar Alterações"}
              colorVariant="success"
              variant="full"
            />
          </div>
        </form>
      </PopupModal>
    </>
  );
}

export default ButtonEditCam;
