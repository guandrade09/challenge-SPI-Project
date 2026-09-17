import React, { useState } from 'react';
import { Plus, Loader2, X, Camera, ShieldAlert, Check } from 'lucide-react';
import { PopupModal, IconButtonModal } from '../../../components/shared';
import { Badge } from '../../../components/ui/Badge'; // Importação do seu Badge

export function ButtonAddCam({
  theme = "dynamic",
  onAddCamera,
  cameras = [],
  colorVariant = "default",
  label = "Adicionar Câmera",
  className = "",
  titlePopup = "Adicionar Nova Câmera"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState('');
  const [ip, setIp] = useState('');
  const [papel, setPapel] = useState('frontal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setorJaTemFrontal = setor.trim()
    ? cameras.some((c) => c.setor?.trim().toLowerCase() === setor.trim().toLowerCase() && c.papel === 'frontal')
    : false;

  const handleClose = () => {
    if (isSubmitting) return;
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

  const resolveIpAndStream = (raw) => {
    const trimmed = raw.trim();
    if (trimmed.startsWith('rtsp://') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const hostMatch = trimmed.match(/@?([\d.]+)(?::\d+)?/);
      return { ip: hostMatch ? hostMatch[1] : trimmed, streamUrl: trimmed };
    }
    const resolvedIp = trimmed || "192.168.1.100";
    return { ip: resolvedIp, streamUrl: `rtsp://${resolvedIp}:554/live/ch0` };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim() || !setor.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const { ip: resolvedIp, streamUrl } = resolveIpAndStream(ip);

    const newCamData = {
      nome: nome.trim(),
      setor: setor.trim(),
      ip: resolvedIp,
      streamUrl,
      papel,
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
              onChange={(e) => {
                const val = e.target.value;
                setSetor(val);
                const jaTemFrontal = cameras.some(
                  (c) => c.setor?.trim().toLowerCase() === val.trim().toLowerCase() && c.papel === 'frontal'
                );
                if (jaTemFrontal) setPapel('lateral');
              }}
              placeholder="Ex: Logística"
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50 transition-colors font-theme-body"
            />
          </div>

          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium font-theme-title">
              Endereço IP ou URL (RTSP/HTTP)
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.100 ou http://192.168.1.100:8080/video"
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50 transition-colors font-mono"
            />
          </div>

          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium font-theme-title">
              Papel na Unidade de Detecção
            </label>
            {setorJaTemFrontal ? (
              <p className="text-[10px] mb-2 text-amber-400">
                Este setor já tem uma câmera frontal. A nova câmera será adicionada como lateral.
              </p>
            ) : (
              <p className="text-theme-muted text-[10px] mb-2">
                Frontal roda a detecção de EPI. Lateral roda ergonomia/zona de risco.
              </p>
            )}
            
            {/* LINHAS 185-200 RESTRUCTURADAS */}
            <div className="flex gap-2">
              {[
                { value: 'frontal', label: 'Frontal (EPI)', icon: Camera },
                { value: 'lateral', label: 'Lateral (Ergonomia)', icon: ShieldAlert },
              ].map((opt) => {
                const bloqueado = opt.value === 'frontal' && setorJaTemFrontal;
                const ativo = papel === opt.value;

                return (
                  <div key={opt.value} className="flex-1 flex flex-col gap-1">
                    <IconButtonModal
                      tipo="button"
                      icon={ativo ? Check : opt.icon}
                      label={opt.label}
                      showLabel={true}
                      onClick={() => !bloqueado && setPapel(opt.value)}
                      disabled={isSubmitting || bloqueado}
                      title={bloqueado ? 'Este setor já tem uma câmera frontal' : undefined}
                      variant="toggle"
                      colorVariant={ativo ? 'default' : 'cancel'}
                      className={`w-full border-2 transition-all ${
                        ativo 
                          ? 'border-[var(--p-subtext)] bg-[var(--p-subtext)]/15 font-bold shadow-lg scale-[1]' 
                          : 'border-theme-divider opacity-70'
                      } ${bloqueado ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}`}
                    />
                  </div>
                );
              })}
            </div>
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