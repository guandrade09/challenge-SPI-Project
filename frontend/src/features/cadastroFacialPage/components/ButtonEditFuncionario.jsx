import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Loader2, X, Save, ImagePlus } from 'lucide-react';
import { PopupModal, IconButtonModal } from '../../../components/shared';
import { streamService } from '../../../services/streamService';

const MAX_FOTOS = 3; // espelha backend/src/api/models/funcionario.model.js (MAX_FOTOS_FUNCIONARIO)

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// `fotos` guarda uma mistura de caminhos já salvos (string simples) e fotos novas (data
// URL base64) — o backend reconhece a diferença e só regrava as que forem base64
// (ver funcionario.service.js#saveFotosIfProvided), então nunca precisamos reconverter
// uma foto existente só porque o usuário adicionou/removeu outra.
export function ButtonEditFuncionario({ funcionario, theme = "dynamic", onEditFuncionario, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [setor, setSetor] = useState('');
  const [cargo, setCargo] = useState('');
  const [fotos, setFotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!funcionario) return;
    setNome(funcionario.nome ?? '');
    setMatricula(funcionario.matricula ?? '');
    setSetor(funcionario.setor ?? '');
    setCargo(funcionario.cargo ?? '');
    setFotos(Array.isArray(funcionario.fotos) ? funcionario.fotos : []);
  }, [funcionario, isOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
  };

  const handleOpen = (e) => {
    if (e) e.stopPropagation();
    setIsOpen(true);
  };

  const handleFotosChange = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_FOTOS - fotos.length);
    e.target.value = '';
    if (files.length === 0) return;
    const base64s = await Promise.all(files.map(fileToBase64));
    setFotos((prev) => [...prev, ...base64s].slice(0, MAX_FOTOS));
  };

  const handleRemoveFoto = (idx) => {
    setFotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Caminho salvo no disco → URL servível; data URL base64 (foto nova) já é exibível direto.
  const previewSrcFor = (foto) => (foto.startsWith('data:') ? foto : streamService.imagePathToUrl(foto));

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
        fotos,
      });
      setIsOpen(false);
    } catch (err) {
      console.error("Erro ao atualizar funcionário:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="flex gap-2">
              {fotos.map((foto, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-theme-divider shrink-0">
                  <img src={previewSrcFor(foto)} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
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
            <span className="text-theme-muted text-[10px] font-theme-body">{fotos.length}/{MAX_FOTOS} fotos</span>
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
