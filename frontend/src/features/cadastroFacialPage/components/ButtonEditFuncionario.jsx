import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Loader2, X, Save, ImagePlus } from 'lucide-react';
import { PopupModal, IconButtonModal } from '../../../components/shared';
import { streamService } from '../../../services/streamService';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ButtonEditFuncionario({ funcionario, theme = "dynamic", onEditFuncionario, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [setor, setSetor] = useState('');
  const [cargo, setCargo] = useState('');
  const [fotoPreview, setFotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!funcionario) return;
    setNome(funcionario.nome ?? '');
    setMatricula(funcionario.matricula ?? '');
    setSetor(funcionario.setor ?? '');
    setCargo(funcionario.cargo ?? '');
    setFotoPreview(null);
  }, [funcionario, isOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
  };

  const handleOpen = (e) => {
    if (e) e.stopPropagation();
    setIsOpen(true);
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setFotoPreview(base64);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!funcionario?.id || !nome.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onEditFuncionario(funcionario.id, {
        nome: nome.trim(),
        matricula: matricula.trim() || null,
        setor: setor.trim() || null,
        cargo: cargo.trim() || null,
        // só reenvia a foto se o usuário trocou; caso contrário mantém a existente
        ...(fotoPreview ? { foto: fotoPreview } : {}),
      });
      setIsOpen(false);
    } catch (err) {
      console.error("Erro ao atualizar funcionário:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewSrc = fotoPreview || (funcionario?.foto_path ? streamService.imagePathToUrl(funcionario.foto_path) : null);

  return (
    <>
      <IconButtonModal
        title="Editar funcionário"
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
        title="Editar Funcionário"
        icon={Pencil}
        maxWidth="max-w-lg"
        theme={theme}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="w-24 h-24 rounded-full border-2 border-dashed border-theme-divider flex items-center justify-center overflow-hidden bg-[var(--p-bg)] hover:border-[var(--p-subtext)] transition-colors disabled:opacity-50"
            >
              {previewSrc ? (
                <img src={previewSrc} alt="Prévia do rosto" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus size={22} className="text-theme-muted" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              disabled={isSubmitting}
              className="hidden"
            />
            <span className="text-theme-muted text-[10px] font-theme-body">Toque para trocar a foto</span>
          </div>

          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium">Nome Completo</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-theme-head text-xs block mb-1 font-medium">Matrícula</label>
              <input
                type="text"
                disabled={isSubmitting}
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50 font-mono"
              />
            </div>
            <div>
              <label className="text-theme-head text-xs block mb-1 font-medium">Setor</label>
              <input
                type="text"
                disabled={isSubmitting}
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="text-theme-head text-xs block mb-1 font-medium">Cargo</label>
            <input
              type="text"
              disabled={isSubmitting}
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-theme-divider bg-[var(--p-bg)] text-theme-main text-xs focus:outline-none focus:border-[var(--p-subtext)] disabled:opacity-50"
            />
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

export default ButtonEditFuncionario;
