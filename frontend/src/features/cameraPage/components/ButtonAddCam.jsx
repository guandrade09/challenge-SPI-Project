// src/features/monitoramentoPage/components/ButtonAddCam.jsx
import React, { useState } from 'react';
import { Plus, Loader2, X } from 'lucide-react';
import { PopupModal, IconButtonModal } from '../../../components/shared';

export function ButtonAddCam({ 
  theme = "dynamic", 
  onAddCamera, 
  variant = "toggle",        // No carrossel ele atua como botão de painel/ícone
  colorVariant = "default",  // Cor padrão do sistema
  label = "Adicionar Câmera",       // Rótulo dinâmico
  className = "",
  titlePopup="Adicionar Nova Câmera"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState('');
  const [ip, setIp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
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
    if (!nome.trim() || !setor.trim()) return;

    setIsSubmitting(true);

    const newCamData = {
      nome: nome.trim(),
      setor: setor.trim(),
      ip: ip.trim() || "192.168.1.100",
      streamUrl: `rtsp://${ip.trim() || "192.168.1.100"}:554/live/ch0`,
      status: "online",
      epis: [
        { id: "1", nome: "capacete" },
        { id: "2", nome: "oculos" },
        { id: "3", nome: "colete" },
        { id: "4", nome: "mascara" },
        { id: "5", nome: "luvas" }
      ]
    };

    try {
      if (onAddCamera) {
        await onAddCamera(newCamData);
      }
      handleClose();
    } catch (err) {
      console.error("Erro ao enviar cadastro da câmera:", err);
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
        variant={"panel-btn-toggle"}
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
        className="text-(var[--p-text]) w-full max-w-[95vw] sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 max-h-[75vh] sm:max-h-none overflow-y-auto pr-1">
          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium">Nome da Câmera</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Pátio Externo"
              className="w-full p-3 sm:p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-base sm:text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50 transition-colors"
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
              className="w-full p-3 sm:p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-base sm:text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50 transition-colors"
            />
          </div>

          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium">Endereço IP / RTSP</label>
            <input
              type="text"
              disabled={isSubmitting}
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.100"
              className="w-full p-3 sm:p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-base sm:text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50 transition-colors"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-theme-divider">
            <IconButtonModal
              tipo="button"
              icon={X}
              onClick={handleClose}
              label="Cancelar"
              colorVariant="cancel"
              variant="full"
              className="w-full sm:w-auto"
            />
            <IconButtonModal
              tipo="submit"
              icon={isSubmitting ? Loader2 : Plus}
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