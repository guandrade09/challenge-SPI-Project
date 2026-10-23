import React, { useState } from 'react';
import { Plus, Loader2, X } from 'lucide-react';
import { PopupModal, IconButtonModal } from '../../../components/shared';

export function ButtonAddCam({ 
  theme = "dynamic", 
  onAddCamera, 
  colorVariant = "default", 
  label = "Adicionar Câmera", 
  className = "",
  titlePopup = "Adicionar Nova Câmera"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState('');
  const [ip, setIp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    setNome('');
    setSetor('');
    setIp('');
    setIsSubmitting(false);
  };

  const handleOpen = (e) => {
    if (e) e.stopPropagation();
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim() || !setor.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const newCamData = {
      nome: nome.trim(),
      setor: setor.trim(),
      ip: ip.trim() || "192.168.1.100",
      streamUrl: `rtsp://${ip.trim() || "192.168.1.100"}:554/live/ch0`,
      status: "online",
      epis: [
        { id: "1", nome: "Capacete" },
        { id: "2", nome: "Óculos" },
        { id: "3", nome: "Colete" },
        { id: "4", nome: "Máscara" },
        { id: "5", nome: "Luvas" }
      ]
    };

    try {
      if (onAddCamera) {
        await onAddCamera(newCamData);
      }
      handleClose();
    } catch (err) {
      console.error("Erro ao enviar cadastro da câmera:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <IconButtonModal
        tipo="button"
        icon={Plus}
        title="Adicionar nova câmera"
        label={label}
        onClick={handleOpen}
        variant="panel-btn-toggle"
        colorVariant={colorVariant}
        className={className}
      />

      <PopupModal
        isOpen={isOpen}
        onClose={handleClose}
        title={titlePopup}
        icon={Plus}
        maxWidth="max-w-lg"
        theme={theme}
        className="w-full max-w-[95vw] sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] sm:max-h-none overflow-y-auto custom-scrollbar pr-1">
          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium font-theme-title">
              Nome da Câmera
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Pátio Externo"
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50 transition-colors font-theme-body"
            />
          </div>

          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium font-theme-title">
              Setor
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              placeholder="Ex: Logística"
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50 transition-colors font-theme-body"
            />
          </div>

          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium font-theme-title">
              Endereço IP / RTSP
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.100"
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50 transition-colors font-mono"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-theme-divider">
            <IconButtonModal
              tipo="button"
              icon={X}
              onClick={handleClose}
              disabled={isSubmitting}
              label="Cancelar"
              colorVariant="cancel"
              variant="full"
              className="w-full sm:w-auto"
            />
            <IconButtonModal
              tipo="submit"
              icon={isSubmitting ? Loader2 : Plus}
              iconClassName={isSubmitting ? "animate-spin" : ""}
              disabled={isSubmitting}
              label={isSubmitting ? "Salvando..." : "Adicionar Câmera"}
              colorVariant="success"
              variant="full"
              className="w-full sm:w-auto"
            />
          </div>
        </form>
      </PopupModal>
    </>
  );
}

export default ButtonAddCam;