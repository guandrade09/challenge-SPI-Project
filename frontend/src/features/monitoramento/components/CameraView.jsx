import React from 'react';
import { Camera, Maximize2, Loader2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { CAMERA_STATUS } from '../constants';

// src/features/monitoramento/components/CameraView.jsx
export const CameraView = ({ status, streamUrl }) => {
  const isOnline = status === 'online'; // Simplificado para o exemplo

  return (
    <div className="relative w-full max-w-[650px]">
      {/* Moldura preta ultra-arredondada */}
      <div className="bg-black rounded-[60px] aspect-[4/5] lg:aspect-square overflow-hidden border-[18px] border-black shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col relative">
        
        {/* Espaço superior preto (Header interno da cam) */}
        <div className="h-16 bg-black w-full" />

        {/* Área do Vídeo */}
        <div className="flex-1 bg-zinc-900 flex items-center justify-center relative overflow-hidden">
           {/* Grid de fundo para simular o PNG da sua imagem enquanto não tem stream */}
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-conic-gradient(#555 0% 25%, #222 0% 50%)', backgroundSize: '40px 40px' }} />
           
           {isOnline && <img src={streamUrl} className="w-full h-full object-cover relative z-10" />}
        </div>

        {/* Espaço inferior preto com botão */}
        <div className="h-20 bg-black w-full flex items-center justify-end px-8">
           <button className="bg-zinc-600/50 p-2 rounded-lg text-zinc-300 hover:bg-zinc-500">
              <Maximize2 size={18} />
           </button>
        </div>
      </div>
    </div>
  );
};

export default CameraView;