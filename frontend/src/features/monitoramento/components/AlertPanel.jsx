import React from 'react';
// Removi o ShieldAlert pois não estava sendo usado no exemplo fornecido, 
// mas você pode mantê-lo se for usar.
import { cn } from '../../../utils/cn';
import { PANEL_STATUS } from '../constants'; // Importando o "Enum"

// Alteramos a prop recebida de 'PANEL_STATUS' para 'status' para evitar conflito
export const AlertPanel = ({ message, status }) => {
  
  // Criamos um mapeamento de estilos baseado nos valores do Enum.
  // Isso deixa o código do renderizador muito mais limpo do que ternários aninhados.
  const statusStyles = {
    [PANEL_STATUS.PRONTO]: "bg-green-600 animate-pulse",
    [PANEL_STATUS.ATENCAO]: "bg-yellow-600 animate-pulse",
    [PANEL_STATUS.ALERTA]: "bg-red-600 animate-pulse",
  };

  // Define um estilo padrão caso um status inválido seja passado
  const currentHeaderClass = statusStyles[status] || "bg-gray-600"; 
  
  // Define o texto do título baseado no status (opcional, para deixar dinâmico)
  const getHeaderText = () => {
    switch (status) {
      case PANEL_STATUS.PRONTO: return "PRONTO";
      case PANEL_STATUS.ATENCAO: return "ATENÇÃO";
      case PANEL_STATUS.ALERTA: return "ALERTA";
      default: return "PAINEL";
    }
  }

  return (
    <div className="rounded-[40px] overflow-hidden shadow-2xl w-full max-w-[420px] ">
      {/* Cabeçalho */}
      <div className={cn(
        "py-6 text-center transition-colors duration-500",
        currentHeaderClass // Aplica a classe baseada no status
      )}>
        <h2 className="text-4xl font-normal tracking-[0.1em] text-white uppercase">
          {getHeaderText()}
        </h2>
      </div>
      
      {/* Corpo */}
      <div className="bg-[#D9D9D9] p-8 pt-4 min-h-[180px]">
        <span className="text-zinc-800 font-bold text-[13px] uppercase tracking-tighter block border-b border-zinc-400 pb-1 mb-4">
          DESCRIÇÃO:
        </span>
        <p className="text-zinc-700 text-lg font-medium leading-tight italic">
          {message || "Nenhuma mensagem fornecida."}
        </p>
      </div>
    </div>
  );
};

export default AlertPanel;