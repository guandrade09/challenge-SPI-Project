import React from 'react';

export function AnalysisCard({
  icon: Icon,
  iconColor = 'text-indigo-400',
  title,
  badgeText,
  badgeColor = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  chartComponent,
  infoItems = [],
}) {
  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl backdrop-blur-md flex flex-col gap-5">
      {/* HEADER DO CARD */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={iconColor} size={20} />}
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            {title}
          </h2>
        </div>
        {badgeText && (
          <span className={`text-[10px] font-mono uppercase border px-2.5 py-1 rounded-md ${badgeColor}`}>
            {badgeText}
          </span>
        )}
      </div>

      {/* CONTEÚDO: GRÁFICO (7 COLS) + PAINEL DE INFORMAÇÕES (5 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* CONTAINER DO GRÁFICO */}
        <div className="lg:col-span-7 h-72 w-full bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          {chartComponent}
        </div>

        {/* PAINEL INFORMATIVO */}
        <div className="lg:col-span-5 grid grid-cols-1 gap-3">
          {infoItems.map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <div key={index} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                <div className={`flex items-center gap-1.5 font-bold text-xs uppercase mb-1 ${item.color || 'text-indigo-400'}`}>
                  {ItemIcon && <ItemIcon size={13} />}
                  <span>{item.title}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default AnalysisCard;