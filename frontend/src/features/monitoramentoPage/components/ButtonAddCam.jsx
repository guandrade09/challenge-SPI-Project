// src/features/monitoramentoPage/components/ButtonAddCam.jsx
import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { PopupModal } from '../../../components/shared/PopupModal';

export function ButtonAddCam({ theme = "dynamic", onAddCamera }) {
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
    if (e) e.stopPropagation(); // Evita interferência com eventos de clique pai (ex: carrossel)
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim() || !setor.trim()) return;

    setIsSubmitting(true);

    // 🚀 Payload limpo enviado ao Backend
    // O id, createdAt, updatedAt e createdBy serão gerenciados pelo Backend/Database
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
      <button
        onClick={handleOpen}
        title="Adicionar nova câmera"
        className="p-1.5 rounded-lg bg-[var(--p-header-bg)] border border-theme-divider text-theme-muted hover:text-theme-main hover:border-[var(--p-subtext)] transition-all active:scale-95 flex items-center justify-center shrink-0"
      >
        <Plus size={16} />
      </button>

      <PopupModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Adicionar Nova Câmera"
        icon={Plus}
        maxWidth="max-w-lg"
        theme={theme}
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
            <label className="text-theme-head text-xs block mb-1 font-medium">Endereço IP / RTSP</label>
            <input
              type="text"
              disabled={isSubmitting}
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.100"
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-theme-divider">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-theme-muted hover:text-theme-main disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-md text-xs font-semibold badge-theme-industrial text-[var(--p-text-title)] active:scale-95 transition-transform flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                'Adicionar Câmera'
              )}
            </button>
          </div>
        </form>
      </PopupModal>
    </>
  );
}

export default ButtonAddCam;