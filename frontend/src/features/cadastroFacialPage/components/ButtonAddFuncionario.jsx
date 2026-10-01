import React, { useState, useRef } from 'react';
import { Plus, Loader2, X, ScanFace, ImagePlus } from 'lucide-react';
import { PopupModal, IconButtonModal } from '../../../components/shared';

const MAX_FOTOS = 3; // espelha backend/src/api/models/funcionario.model.js (MAX_FOTOS_FUNCIONARIO)

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ButtonAddFuncionario({
  theme = "dynamic",
  onAddFuncionario,
  colorVariant = "success",
  label = "Adicionar Funcionário",
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [setor, setSetor] = useState('');
  const [cargo, setCargo] = useState('');
  const [fotos, setFotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    setNome('');
    setMatricula('');
    setSetor('');
    setCargo('');
    setFotos([]);
  };

  const handleOpen = (e) => {
    if (e) e.stopPropagation();
    setIsOpen(true);
  };

  const handleFotosChange = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_FOTOS - fotos.length);
    e.target.value = ''; // permite escolher o mesmo arquivo de novo depois de remover
    if (files.length === 0) return;
    const base64s = await Promise.all(files.map(fileToBase64));
    setFotos((prev) => [...prev, ...base64s].slice(0, MAX_FOTOS));
  };

  const handleRemoveFoto = (idx) => {
    setFotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddFuncionario({
        nome: nome.trim(),
        matricula: matricula.trim() || null,
        setor: setor.trim() || null,
        cargo: cargo.trim() || null,
        fotos,
      });
      handleClose();
    } catch (err) {
      console.error("Erro ao enviar cadastro facial:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <IconButtonModal
        tipo="button"
        icon={Plus}
        title="Cadastrar novo funcionário"
        label={label}
        onClick={handleOpen}
        variant="panel-btn-toggle"
        colorVariant={colorVariant}
        className={className}
      />

      <PopupModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Cadastro Facial"
        icon={ScanFace}
        maxWidth="max-w-lg"
        theme={theme}
        className="w-full max-w-[95vw] sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] sm:max-h-none overflow-y-auto custom-scrollbar pr-1">
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {fotos.map((foto, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-theme-divider shrink-0">
                  <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveFoto(idx)}
                    disabled={isSubmitting}
                    title="Remover foto"
                    className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-600/90 rounded-full p-0.5 transition-colors"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
              {fotos.length < MAX_FOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-theme-divider flex items-center justify-center overflow-hidden bg-[var(--p-bg)] hover:border-[var(--p-subtext)] transition-colors disabled:opacity-50 shrink-0"
                >
                  <ImagePlus size={20} className="text-theme-muted" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFotosChange}
              disabled={isSubmitting}
              className="hidden"
            />
            <span className="text-theme-muted text-[10px] font-theme-body">
              {fotos.length}/{MAX_FOTOS} fotos — rosto de frente, bem iluminado. Mais fotos (ângulos/luz diferentes) melhoram a precisão.
            </span>
          </div>

          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium font-theme-title">Nome Completo</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João da Silva"
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50 transition-colors font-theme-body"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-theme-head text-xs block mb-1 font-medium font-theme-title">Matrícula</label>
              <input
                type="text"
                disabled={isSubmitting}
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Ex: 00123"
                className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="text-theme-head text-xs block mb-1 font-medium font-theme-title">Setor</label>
              <input
                type="text"
                disabled={isSubmitting}
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                placeholder="Ex: Logística"
                className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50 transition-colors font-theme-body"
              />
            </div>
          </div>

          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium font-theme-title">Cargo</label>
            <input
              type="text"
              disabled={isSubmitting}
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ex: Operador de Empilhadeira"
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50 transition-colors font-theme-body"
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
              disabled={isSubmitting}
              label={isSubmitting ? "Salvando..." : "Cadastrar"}
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

export default ButtonAddFuncionario;
