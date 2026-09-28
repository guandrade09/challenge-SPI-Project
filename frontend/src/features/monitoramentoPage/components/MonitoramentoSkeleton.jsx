// src/features/monitoramentoPage/components/MonitoramentoSkeleton.jsx
import React from 'react';

export function MonitoramentoSkeleton({ theme = 'dark' }) {
  const isDark = theme === 'dark';

  const containerBg = isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/70 border-slate-200';
  const blockBg = isDark ? 'bg-slate-700' : 'bg-slate-200';
  const blockLightBg = isDark ? 'bg-slate-700/60' : 'bg-slate-200/60';

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 animate-pulse max-w-[auto] mx-auto w-full justify-between">
      {/* Skeleton do Carrossel de Vídeo Principal */}
      <div className={`w-full h-[840px] ${containerBg} rounded-2xl border flex flex-col justify-between p-6 transition-colors`}>
        {/* Header da Câmera (Nome/Setor) */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className={`h-6 w-48 ${blockBg} rounded-md`} />
            <div className={`h-4 w-28 ${blockLightBg} rounded-md`} />
          </div>
          <div className={`h-8 w-24 ${blockBg} rounded-full`} />
        </div>

        {/* Centro (Player de Vídeo/Placeholder) */}
        <div className="flex items-center justify-center">
          <div className={`h-12 w-12 rounded-full ${blockLightBg}`} />
        </div>

        {/* Miniaturas das Câmeras no Rodapé */}
        <div className="flex space-x-4 justify-center pt-4">
          <div className={`h-16 w-28 ${blockBg} rounded-xl`} />
          <div className={`h-16 w-28 ${blockBg} rounded-xl`} />
          <div className={`h-16 w-28 ${blockBg} rounded-xl`} />
        </div>
      </div>

      {/* Skeleton do Painel de EPIs */}
      <div className={`w-full h-32 ${containerBg} rounded-2xl border p-6 flex flex-col justify-between transition-colors`}>
        <div className={`h-5 w-40 ${blockBg} rounded-md`} />
        <div className="flex space-x-3">
          <div className={`h-10 w-24 ${blockBg} rounded-lg`} />
          <div className={`h-10 w-24 ${blockBg} rounded-lg`} />
          <div className={`h-10 w-24 ${blockBg} rounded-lg`} />
          <div className={`h-10 w-24 ${blockBg} rounded-lg`} />
        </div>
      </div>
    </div>
  );
}

export default MonitoramentoSkeleton;