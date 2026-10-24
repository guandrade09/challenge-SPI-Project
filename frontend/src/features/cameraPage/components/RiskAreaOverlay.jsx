import React, { useState, useEffect } from 'react';
import { AlertTriangle, Edit3, Trash2 } from 'lucide-react'; // Import Trash2 para o badge de instrução
import { useElementSize } from '../../../hooks/useElementSize';
import {
  getCoverTransform,
  containerToFramePercent,
  framePercentToContainer,
  frameBoxToContainerRect,
} from '../../../utils/coverTransform';

// O retângulo (`box`, `startPos`, e o que vai para onSaveBox) é guardado em % do FRAME
// (0..100 da imagem real), não do container. O <img> usa object-cover (escala + crop), então
// % do container ≠ % do frame. O orquestrador converte esse % em pixels do frame para gravar
// a zona; com % do frame a zona fica exatamente onde o usuário viu na imagem.
// Sem frameWidth/frameHeight (ainda sem frame), cai no comportamento antigo (% do container).
export const RiskAreaOverlay = ({
  initialBox = null,
  onSaveBox,
  isEditing,
  frameWidth = null,
  frameHeight = null,
}) => {
  const [containerEl, setContainerEl] = useState(null);
  const { width: containerW, height: containerH } = useElementSize(containerEl);
  const transform = getCoverTransform(containerW, containerH, frameWidth, frameHeight);
  const [box, setBox] = useState(initialBox);
  
  // Controla se o usuário já deu o 1º clique para definir a posição inicial
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);

  // Sincroniza o estado interno com a prop initialBox (quando muda a câmera ou fecha a edição)
  useEffect(() => {
    setBox(initialBox);
    if (!isEditing) {
      setIsDrawing(false);
      setStartPos(null);
    }
  }, [initialBox, isEditing]);

  // --- NOVA LÓGICA: ESCUTAR EVENTO DE LIMPAR ---
  useEffect(() => {
    // Função que será executada quando o evento customizado 'clear_risk_area' for detectado
    const handleClearEvent = () => {
      if (!isEditing) return;
      setBox(null); // Limpa o retângulo visualmente
      setIsDrawing(false); // Reseta fluxo de desenho
      setStartPos(null);
      // Opcional: Se quiser que ao limpar, já salve na store que está vazia
      if (onSaveBox) {
        onSaveBox(null);
      }
    };

    // Adiciona o listener global
    window.addEventListener('clear_risk_area', handleClearEvent);

    // Remove o listener ao desmontar o componente para evitar vazamento de memória
    return () => {
      window.removeEventListener('clear_risk_area', handleClearEvent);
    };
  }, [isEditing, onSaveBox]);

  // Ponto do mouse → % do FRAME (desfaz o escala/crop do object-cover). Sem dimensões do
  // frame, mantém o comportamento antigo (% do container).
  const getRelativeCoords = (e) => {
    if (!containerEl) return { x: 0, y: 0 };
    const rect = containerEl.getBoundingClientRect();
    if (transform) {
      return containerToFramePercent(transform, e.clientX - rect.left, e.clientY - rect.top);
    }
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  // % do frame → posição na tela (a mesma transformação, no sentido inverso)
  const startPoint = transform && startPos ? framePercentToContainer(transform, startPos.x, startPos.y) : null;
  const boxRect = transform && box ? frameBoxToContainerRect(transform, box) : null;

  // Trata a lógica de 2 cliques no container da câmera
  const handleClick = (e) => {
    if (!isEditing) return;

    const coords = getRelativeCoords(e);

    if (!isDrawing) {
      // --- 1º CLIQUE: Define o Ponto Inicial ---
      setStartPos(coords);
      setIsDrawing(true);
      setBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
    } else {
      // --- 2º CLIQUE: Define o Ponto Final e Conclui ---
      const x = Math.min(startPos.x, coords.x);
      const y = Math.min(startPos.y, coords.y);
      const width = Math.abs(coords.x - startPos.x);
      const height = Math.abs(coords.y - startPos.y);

      const finalBox = { x, y, width, height };

      // Aceita apenas retângulos minimamente visíveis
      if (width > 0.5 && height > 0.5) {
        setBox(finalBox);
        if (onSaveBox) {
          onSaveBox(finalBox);
        }
      } else {
        // Se o retângulo for inválido (clique no mesmo lugar), limpa a seleção
        setBox(null);
        if (onSaveBox) onSaveBox(null);
      }

      // Finaliza o fluxo de desenho
      setIsDrawing(false);
      setStartPos(null);
    }
  };

  // Faz o retângulo acompanhar o ponteiro entre o 1º e o 2º clique
  const handleMouseMove = (e) => {
    if (!isDrawing || !isEditing || !startPos) return;

    const currentCoords = getRelativeCoords(e);

    const x = Math.min(startPos.x, currentCoords.x);
    const y = Math.min(startPos.y, currentCoords.y);
    const width = Math.abs(currentCoords.x - startPos.x);
    const height = Math.abs(currentCoords.y - startPos.y);

    setBox({ x, y, width, height });
  };

  return (
    <div
      ref={setContainerEl}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      className={`absolute inset-0 z-20 transition-all ${
        isEditing
          ? 'cursor-crosshair bg-black/40 backdrop-blur-[1px] select-none pointer-events-auto'
          : 'pointer-events-none bg-transparent'
      }`}
    >
      {/* Ponto Visual do 1º Clique */}
      {isDrawing && startPos && (
        <div
          style={startPoint
            ? { left: `${startPoint.x}px`, top: `${startPoint.y}px` }
            : { left: `${startPos.x}%`, top: `${startPos.y}%` }}
          className="absolute w-3.5 h-3.5 -ml-1.75 -mt-1.75 bg-[var(--risk-edit-border)] border-2 border-black rounded-full shadow-[0_0_10px_var(--risk-edit-border)] animate-ping pointer-events-none z-30"
        />
      )}

      {/* Exibição do Retângulo da Área de Risco */}
      {box && box.width > 0.5 && box.height > 0.5 && (
        <div
          style={{
            ...(boxRect
              ? {
                  left: `${boxRect.left}px`,
                  top: `${boxRect.top}px`,
                  width: `${boxRect.width}px`,
                  height: `${boxRect.height}px`,
                }
              : {
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                }),
            borderColor: isEditing ? 'var(--risk-edit-border)' : 'var(--risk-alert-border)',
            backgroundColor: isEditing ? 'var(--risk-edit-bg)' : 'var(--risk-alert-bg)',
          }}
          className={`absolute transition-all border-2 ${
            isEditing
              ? 'border-dashed shadow-[0_0_15px_var(--risk-edit-bg)]'
              : 'border-solid shadow-[0_0_15px_rgba(239,68,68,0.4)] ring-1 ring-[var(--risk-alert-border)]/50'
          }`}
        >
          {/* Badge Superior */}
          <div 
            style={{ backgroundColor: isEditing ? 'var(--risk-edit-badge)' : 'var(--risk-alert-badge)' }}
            className="absolute -top-7 left-0 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md flex items-center gap-1.5 uppercase tracking-wider whitespace-nowrap pointer-events-none font-mono"
          >
            {isEditing ? (
              <Edit3 size={12} className="text-amber-200" />
            ) : (
              <AlertTriangle size={12} className="text-yellow-300" />
            )}
            <span>Área de Risco {isEditing ? (isDrawing ? '(Definindo final)' : '(Editando)') : '(Fixada)'}</span>
          </div>
        </div>
      )}

      {/* Instrução Flutuante Adaptativa */}
      {isEditing && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-30">
          <span className="text-xs font-medium text-[var(--p-text)] bg-[var(--p-header-bg)] px-4 py-2 rounded-full border border-[var(--p-border)] backdrop-blur-md shadow-xl flex items-center gap-2 font-mono">
            {box && !isDrawing ? (
                 <Trash2 style={{color: 'var(--risk-edit-border)'}} size={14} className="shrink-0" />
            ) : (
                <span 
                  style={{ backgroundColor: 'var(--risk-edit-border)' }}
                  className="w-2 h-2 rounded-full animate-pulse shrink-0" 
                />
            )}
           
            {!isDrawing 
              ? (box ? 'Clique para desenhar uma nova Área de Risco (Limpa a atual)' : 'Clique para marcar a Posição Inicial (Eixo A)') 
              : 'Clique em outro ponto para definir a Posição Final (Eixo B)'}
          </span>
        </div>
      )}
    </div>
  );
};

export default RiskAreaOverlay;
