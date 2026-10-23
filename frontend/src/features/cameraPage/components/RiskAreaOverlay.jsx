import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, Edit3 } from 'lucide-react';

export const RiskAreaOverlay = ({
  initialBox = null,
  onSaveBox,
  isEditing,
}) => {
  const containerRef = useRef(null);
  const [box, setBox] = useState(initialBox);
  
  // Controla se o usuário já deu o 1º clique para definir a posição inicial
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);

  // Reseta estados quando o modo de edição for desativado
  useEffect(() => {
    setBox(initialBox);
    if (!isEditing) {
      setIsDrawing(false);
      setStartPos(null);
    }
  }, [initialBox, isEditing]);

  const getRelativeCoords = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

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

      if (width > 0.5 && height > 0.5) {
        setBox(finalBox);
        if (onSaveBox) {
          onSaveBox(finalBox);
        }
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
      ref={containerRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      className={`absolute inset-0 z-20 transition-colors ${
        isEditing ? 'cursor-crosshair bg-[var(--p-overlay)] select-none pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Ponto Visual do 1º Clique */}
      {isDrawing && startPos && (
        <div
          style={{ left: `${startPos.x}%`, top: `${startPos.y}%` }}
          className="absolute w-3.5 h-3.5 -ml-1.75 -mt-1.75 bg-[var(--risk-edit-border)] border-2 border-black rounded-full shadow-[0_0_10px_var(--risk-edit-border)] animate-ping pointer-events-none z-30"
        />
      )}

      {/* Exibição do Retângulo da Área de Risco */}
      {box && box.width > 0.5 && box.height > 0.5 && (
        <div
          style={{
            left: `${box.x}%`,
            top: `${box.y}%`,
            width: `${box.width}%`,
            height: `${box.height}%`,
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
            <span 
              style={{ backgroundColor: 'var(--risk-edit-border)' }}
              className="w-2 h-2 rounded-full animate-pulse shrink-0" 
            />
            {!isDrawing 
              ? 'Clique para marcar a Posição Inicial (Eixo A)' 
              : 'Clique em outro ponto para definir a Posição Final (Eixo B)'}
          </span>
        </div>
      )}
    </div>
  );
};

export default RiskAreaOverlay;