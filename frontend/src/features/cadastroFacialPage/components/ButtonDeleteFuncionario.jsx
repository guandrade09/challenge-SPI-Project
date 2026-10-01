import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { PopupModal, IconButtonModal } from '../../../components/shared';

export function ButtonDeleteFuncionario({ funcionario, theme = "dynamic", onDeleteFuncionario }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpen = (e) => {
    if (e) e.stopPropagation();
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isDeleting) return;
    setIsOpen(false);
  };

  const handleDelete = async () => {
    if (!funcionario?.id || isDeleting) return;

    setIsDeleting(true);
    try {
      if (onDeleteFuncionario) {
        await onDeleteFuncionario(funcionario.id);
      }
      setIsOpen(false);
    } catch (err) {
      console.error("Erro ao excluir funcionário:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <IconButtonModal
        title="Excluir funcionário"
        label=""
        icon={Trash2}
        onClick={handleOpen}
        variant="panel-btn-toggle"
        colorVariant="cancel"
        className="p-1.5"
      />

      <PopupModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Confirmar Exclusão"
        icon={AlertTriangle}
        maxWidth="max-w-md"
        theme={theme}
      >
        <div className="space-y-3 sm:space-y-4">
          <p className="text-theme-main text-sm leading-relaxed font-theme-body">
            Tem certeza que deseja excluir o cadastro facial de{' '}
            <span className="font-semibold text-theme-title underline decoration-[var(--chart-line-alert,#ef4444)] break-words">
              "{funcionario?.nome}"
            </span>?
          </p>
          <p className="text-theme-muted text-xs leading-relaxed font-theme-body">
            Esta ação não poderá ser desfeita. O orquestrador deixará de reconhecer este rosto nas câmeras.
          </p>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-theme-divider">
            <IconButtonModal
              tipo="button"
              onClick={handleClose}
              disabled={isDeleting}
              label="Cancelar"
              colorVariant="default"
              variant="full"
              className="w-full sm:w-auto"
            />
            <IconButtonModal
              tipo="button"
              onClick={handleDelete}
              disabled={isDeleting}
              label={isDeleting ? "Excluindo..." : "Deletar"}
              icon={isDeleting ? Loader2 : Trash2}
              colorVariant="danger"
              variant="full"
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </PopupModal>
    </>
  );
}

export default ButtonDeleteFuncionario;
