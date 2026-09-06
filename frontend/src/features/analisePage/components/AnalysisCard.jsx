import React from 'react';

export function AnalysisCard({
  icon: Icon,
  iconColor,
  title,
  badgeText,
  headerAction,
  chartComponent,
  infoItems = [],
  theme = 'dynamic',
}) {
  return (
    <section className={`panel-theme-${theme} panel-card border border-theme-divider rounded-2xl p-5 md:p-6 flex flex-col gap-5 transition-colors duration-300 bg-[var(--p-header-bg)]`}>
      {/* HEADER DO CARD */}
      <div className="flex items-center justify-between border-b border-theme-divider pb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon 
              className="text-[var(--p-accent,#6366f1)]"
              style={iconColor ? { color: iconColor } : undefined} 
              size={20} 
            />
          )}
          <h2 className="text-lg font-bold uppercase tracking-wider text-[var(--p-text-subtitle)]">
            {title}
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          {headerAction}
          {badgeText && (
            <span className="text-[13px] font-bold uppercase border border-theme-divider px-2.5 py-1 rounded-md text-[var(--p-text-subtitle)] bg-[var(--p-bg)]">
              {badgeText}
            </span>
          )}
        </div>
      </div>

      {/* CONTEÚDO: GRÁFICO + PAINEL DE INFORMAÇÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* CONTAINER DO GRÁFICO */}
        <div className="lg:col-span-7 h-72 w-full p-4 rounded-xl border border-theme-divider bg-[var(--p-chart-bg,transparent)]">
          {chartComponent}
        </div>

        {/* PAINEL INFORMATIVO */}
        <div className="lg:col-span-5 grid grid-cols-1 gap-3">
          {infoItems.map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <div 
                key={index} 
                className="border border-theme-divider rounded-xl p-3.5 bg-[var(--p-bg)] transition-colors duration-200"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs uppercase mb-1 text-[var(--p-text-subtitle)]">
                  {ItemIcon && <ItemIcon size={13} className="text-[var(--p-accent,#6366f1)]" />}
                  <span>{item.title}</span>
                </div>
                <p className="text-xs leading-relaxed text-[var(--p-text-muted)]">
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