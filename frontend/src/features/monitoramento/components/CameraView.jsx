// src/features/monitoramento/components/CameraView.jsx
import React from 'react';
import { Maximize2 } from 'lucide-react';

export const CameraView = ({ status, streamUrl }) => {
  const isOnline = status === 'online';

  return (
    /* 1. MUDANÇA: Usamos aspect-[3/4] para criar o formato vertical (mais alto) */
    <div className="relative bg-black rounded-[45px] aspect-[3/4] w-full max-w-[480px] overflow-hidden border-[12px] border-black shadow-xl flex flex-col relative">
      
      {/* Espaço superior preto (Header interno) */}
      <div className="h-14 bg-black w-full" />

      {/* Área do Vídeo: Ocupa o centro com o fundo quadriculado (Fundo da Imagem 2) */}
      <div className="flex-1 bg-white flex items-center justify-center relative overflow-hidden">
         {/* Grid de fundo para transparência simulada */}
         <div 
           className="absolute inset-0 opacity-20" 
           style={{ 
             backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
             backgroundSize: '20px 20px',
             backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' 
           }} 
         />
         
         {isOnline && streamUrl && (
           <img src={streamUrl} alt="Stream" className="w-full h-full object-cover relative z-10" />
         )}
      </div>

      {/* Espaço inferior preto com o botão de expansão redondo */}
      <div className="h-16 bg-black w-full flex items-center justify-end px-6">
         <button className="bg-zinc-800/80 p-2.5 rounded-full text-white/80 hover:bg-zinc-700/80 transition-all border border-zinc-700">
            <Maximize2 size={18} />
         </button>
      </div>
    </div>
  );
};

export default CameraView;