import { X } from 'lucide-react';
import { IconButtonModal } from './IconButtonModal';

export const PopupModal = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  maxWidth = "max-w-md",
  actions = [] // Array de: { icon: Icon, onClick: fn, label: string }
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className={`relative w-full ${maxWidth} bg-panel-bg rounded-panel shadow-2xl overflow-hidden animate-in zoom-in duration-300`}>
        {/* Header */}
        <div className="bg-panel-header p-4 flex justify-between items-center border-b border-black/5">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={18} className="text-zinc-800" />}
            <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-800">
              {title}
            </h3>
          </div>

          {/* Grupo de Ações */}
          <div className="flex items-center gap-1">
            {actions.map((action, index) => (
              <IconButtonModal
                key={index}
                icon={action.icon}
                onClick={action.onClick}
                title={action.label} // O title aparece no hover
                variant="ghost"      // Mantém o botão minimalista no header
              />
            ))}
            
            {/* Divisor se houver ações extras */}
            {actions.length > 0 && (
              <div className="w-[1px] h-4 bg-black/10 mx-1" />
            )}

            <IconButtonModal
              icon={X}
              onClick={onClose}
              title="Fechar"
              variant="ghost"
            />
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PopupModal;