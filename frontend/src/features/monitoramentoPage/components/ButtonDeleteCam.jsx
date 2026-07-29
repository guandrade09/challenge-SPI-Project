import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { PopupModal } from '../../../components/shared/PopupModal';

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
      <button
        onClick={handleOpen}
        title="Excluir câmera"
        className="p-1.5 rounded-lg bg-[var(--p-header-bg)] border border-theme-divider text-rose-400 hover:text-rose-300 hover:border-rose-500/50 transition-all active:scale-95 flex items-center justify-center shrink-0"
      >
        <Trash2 size={16} />
      </button>

      <PopupModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Confirmar Exclusão"
        icon={AlertTriangle}
        maxWidth="max-w-md"
        theme={theme}
      >
        <div className="space-y-4">
          <p className="text-theme-main text-sm">
            Tem certeza que deseja excluir a câmera{' '}
            <span className="font-semibold text-rose-400">"{camera?.nome}"</span>?
          </p>
          <p className="text-theme-muted text-xs">
            Esta ação não poderá ser desfeita e os dados de monitoramento associados a esta câmera deixarão de ser exibidos.
          </p>

          <div className="flex justify-end gap-2 pt-4 border-t border-theme-divider">
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-theme-muted hover:text-theme-main disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="px-4 py-1.5 rounded-md text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Confirmar Exclusão'
              )}
            </button>
          </div>
        </div>
      </PopupModal>
    </>
  );
}

export default ButtonDeleteCam;