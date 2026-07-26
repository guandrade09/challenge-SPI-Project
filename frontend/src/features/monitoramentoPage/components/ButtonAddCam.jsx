// src/features/monitoramentoPage/components/ButtonAddCam.jsx
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { PopupModal } from '../../../components/shared/PopupModal';

export function ButtonAddCam({ theme = "dynamic", onAddCamera }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState('');
  const [ip, setIp] = useState('');

  const handleClose = () => {
    setIsOpen(false);
    setNome('');
    setSetor('');
    setIp('');
  };

  const handleOpen = (e) => {
    e.stopPropagation(); // Evita navegar no carrossel ao clicar no botão
    setIsOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome || !setor) return;

    const newCam = {
      id: Date.now(),
      nome,
      setor,
      ip: ip || "192.168.1.100",
      epis: [
        { id: "1", nome: "capacete" },
        { id: "2", nome: "oculos" },
        { id: "3", nome: "colete" }
      ]
    };

    if (onAddCamera) {
      onAddCamera(newCam);
    }

    handleClose();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        title="Adicionar nova câmera"
        className="p-1 rounded-lg bg-[var(--p-header-bg)] border border-theme-divider text-theme-muted hover:text-theme-main hover:border-[var(--p-subtext)] transition-all active:scale-95 flex items-center justify-center shrink-0"
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
            <label className="text-theme-head text-xs block mb-1">Nome da Câmera</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Pátio Externo"
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)]"
            />
          </div>

          <div>
            <label className="text-theme-head text-xs block mb-1">Setor</label>
            <input
              type="text"
              required
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              placeholder="Ex: Logística"
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)]"
            />
          </div>

          <div>
            <label className="text-theme-head text-xs block mb-1">Endereço IP / RTSP</label>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.100"
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-theme-divider">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-theme-muted hover:text-theme-main"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md text-xs font-semibold badge-theme-industrial text-[var(--p-text-title)] active:scale-95 transition-transform"
            >
              Adicionar Câmera
            </button>
          </div>
        </form>
      </PopupModal>
    </>
  );
}

export default ButtonAddCam;