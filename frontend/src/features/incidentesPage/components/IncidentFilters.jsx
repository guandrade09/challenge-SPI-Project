import React from 'react';
import { Search, Filter } from 'lucide-react';

export function IncidentFilters({
  search,
  onSearchChange,
  source,
  onSourceChange,
  sources = [],
  onlyAlerts,
  onToggleAlerts
}) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-48">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
        <input
          type="text"
          placeholder="Buscar por label..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-[var(--p-header-bg)] border border-[var(--p-border)] rounded-lg text-sm text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-blue-500/50 transition-colors"
        />
      </div>

      <select
        value={source}
        onChange={(e) => onSourceChange(e.target.value)}
        className="px-3 py-2 bg-[var(--p-header-bg)] border border-[var(--p-border)] rounded-lg text-sm text-theme-main focus:outline-none focus:border-blue-500/50 transition-colors"
      >
        <option value="">Todas as fontes</option>
        {sources.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <button
        onClick={onToggleAlerts}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
          onlyAlerts
            ? 'bg-red-500/20 border-red-500/40 text-red-500 font-semibold'
            : 'bg-[var(--p-header-bg)] border-[var(--p-border)] text-theme-muted hover:text-theme-main'
        }`}
      >
        <Filter size={14} />
        Só alertas
      </button>
    </div>
  );
}

export default IncidentFilters;