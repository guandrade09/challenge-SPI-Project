// src/features/monitoramentoPage/components/ButtonAddCam.jsx
import React, { useState } from 'react';
import { Plus, Loader2, X } from 'lucide-react';
import { PopupModal, IconButtonModal } from '../../../components/shared';

export function ButtonAddCam({ 
  theme = "dynamic", 
  onAddCamera, 
  variant = "toggle",         // No carrossel ele atua como botão de painel/ícone
  colorVariant = "default",  // Cor padrão do sistema
  label = "Adicionar",       // Rótulo dinâmico
  className = "" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState('');
  const [ip, setIp] = useState('');
  const [papel, setPapel] = useState('frontal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    setNome('');
    setSetor('');
    setIp('');
    setPapel('frontal');
    setIsSubmitting(false);
  };

  const handleOpen = (e) => {
    if (e) e.stopPropagation();
    setIsOpen(true);
  };

  // Aceita tanto um IP puro (usa o path padrão) quanto uma URL RTSP completa
  // já validada no VLC (com usuário/senha), ex: rtsp://admin:senha@192.168.15.2:554/onvif1
  const resolveIpAndStream = (raw) => {
    const trimmed = raw.trim();
    if (trimmed.startsWith('rtsp://')) {
      const hostMatch = trimmed.match(/@?([\d.]+):\d+/);
      return { ip: hostMatch ? hostMatch[1] : trimmed, streamUrl: trimmed };
    }
    const resolvedIp = trimmed || "192.168.1.100";
    return { ip: resolvedIp, streamUrl: `rtsp://${resolvedIp}:554/live/ch0` };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim() || !setor.trim()) return;

    setIsSubmitting(true);

    const { ip: resolvedIp, streamUrl } = resolveIpAndStream(ip);

    const newCamData = {
      nome: nome.trim(),
      setor: setor.trim(),
      ip: resolvedIp,
      streamUrl,
      status: "online",
      papel,
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
      {/* Aqui o IconButtonModal recebe exatamente o estilo e variante configurados */}
      <IconButtonModal
        tipo="button"
        icon={Plus}
        title="Adicionar nova câmera"
        label={label}
        onClick={handleOpen}
        variant={"full"}
        colorVariant={colorVariant}
        className={className}
      />

      <PopupModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Adicionar Nova Câmera"
        icon={Plus}
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
              placeholder="192.168.1.100 ou rtsp://admin:senha@192.168.1.100:554/onvif1"
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50"
            />
            <p className="text-theme-muted text-[10px] mt-1">
              Cole aqui a URL completa já testada no VLC (com usuário e senha) para garantir que o caminho e as credenciais estejam corretos.
            </p>
          </div>

          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium">Papel na Unidade de Detecção</label>
            <p className="text-theme-muted text-[10px] mb-2">
              Frontal roda a detecção de EPI. Lateral roda ergonomia/zona de risco (necessária pra medir postura corretamente).
            </p>
            <div className="flex gap-2">
              {[
                { value: 'frontal', label: 'Frontal (EPI)' },
                { value: 'lateral', label: 'Lateral (Ergonomia/Zona)' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setPapel(opt.value)}
                  className={`flex-1 p-2 rounded-lg border text-xs transition-colors disabled:opacity-50 ${
                    papel === opt.value
                      ? 'border-[var(--p-subtext)] text-[var(--p-subtext)] bg-[var(--p-subtext)]/10'
                      : 'border-theme-divider text-theme-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
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
              icon={isSubmitting ? Loader2 : Plus}
              label={isSubmitting ? "Salvando..." : "Adicionar Câmera"}
              colorVariant="success"
              variant="full"
            />
          </div>
        </form>
      </PopupModal>
    </>
  );
}

export default ButtonAddCam;