// src/features/monitoramentoPage/components/ButtonDeleteCam.jsx
import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { PopupModal, IconButtonModal } from '../../../components/shared';

export function ButtonDeleteCam({ camera, theme = "dynamic", onDeleteCamera }) {
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
    if (!camera?.id) return;

    setIsDeleting(true);
    try {
      if (onDeleteCamera) {
        await onDeleteCamera(camera.id);
      }
      setIsOpen(false);
    } catch (err) {
      console.error("Erro ao excluir câmera:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <IconButtonModal
        title={"Excluir câmera"}
        label={"Excluir"}
        icon={Trash2}
        onClick={handleOpen}
        variant='panel-btn-toggle'
        colorVariant='cancel'
      />

      <PopupModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Confirmar Exclusão"
        icon={AlertTriangle}
        maxWidth="max-w-md"
        theme={theme}
        className="w-full max-w-[95vw] sm:max-w-md"
      >
        <div className="space-y-3 sm:space-y-4">
          <p className="text-theme-main text-sm leading-relaxed">
            Tem certeza que deseja excluir a câmera{' '}
            <span className="font-semibold text-rose-400 break-words">"{camera?.nome}"</span>?
          </p>
          <p className="text-theme-muted text-xs leading-relaxed">
            Esta ação não poderá ser desfeita e os dados de monitoramento associados a esta câmera deixarão de ser exibidos.
          </p>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-theme-divider">
            <IconButtonModal
              tipo="button"
              onClick={handleClose}
              label={"Cancelar"}
              colorVariant='default'
              variant='full'
              className="w-full sm:w-auto"
            />
            <IconButtonModal
              tipo="button"
              onClick={handleDelete}
              label={isDeleting ? "Excluindo..." : "Deletar"}
              icon={isDeleting ? Loader2 : Trash2}
              colorVariant='danger'
              variant='full'
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </PopupModal>
    </>
  );
}

export default ButtonDeleteCam;