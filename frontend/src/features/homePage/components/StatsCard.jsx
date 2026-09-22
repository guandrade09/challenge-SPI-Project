import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { TrendingUp, TrendingDown } from "lucide-react";

export function StatsCard({ title, value, description, trend, theme = "dark", icon: Icon }) {
  return (
    <div className={`panel-theme-${theme} font-theme-body`}>
      <Card className="panel-base gap-3 backdrop-blur-sm relative overflow-hidden transition-all duration-200 hover:border-[var(--p-subtext)]">
        
        {/* Cabeçalho do Card */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-theme-title">
          <CardTitle className="font-title text-[var(--p-text-subtitle)]]">
            {title}
          </CardTitle>

          {/* Ícone opcional no canto direito (envolvido em micro-card industrial) */}
          {Icon && (
            <div className="p-1.5 rounded-lg bg-[var(--p-header-bg)] border border-[var(--p-border)] text-theme-title text-[var(--p-text-title)]">
              <Icon className="w-3 h-3 opacity-80" />
            </div>
          )}
        </CardHeader>

        {/* Conteúdo Central e Métricas */}
        <CardContent className="pt-1 text-theme-title">
          {/* Valor Numérico Principal: Fonte Sora e tamanho imponente */}
          <div className="text-3xl font-bold uppercase tracking-tight text-[var(--p-text-subtitle)]">
            {value}
          </div>

          {/* Tendência (Trend) */}
          {trend && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider">
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-[var(--p-border)] bg-[var(--p-header-bg)] ${
                trend.isPositive ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}'
                <span className="font-semibold uppercase">{Math.abs(trend.value)}%</span>
              </span>
              <span className="text-theme-muted uppercase">vs. mês anterior</span>
            </div>
          )}

          {/* Descrição Secundária */}
          {description && (
            <p className="text-theme-muted text-[11px] mt-1.5 leading-relaxed absolute bottom-3 uppercase">
              {description}
            </p>
          )}
        </CardContent>

      </Card>
    </div>
  );
}

export default StatsCard;