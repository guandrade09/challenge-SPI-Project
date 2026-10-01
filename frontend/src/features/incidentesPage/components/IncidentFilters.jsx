import { Download, Filter, ListChecks, Trash2, X } from 'lucide-react';

export function IncidentFilters({
  activeFilters,
  options,
  onAddFilter,
  onRemoveFilter,
  source,
  onSourceChange,
  sources = [],
  camera,
  cameras = [],
  onCameraChange,
  onlyAlerts,
  onToggleAlerts,
  selectedCount,
  filteredCount,
  allFilteredSelected,
  onToggleSelectAll,
  onOpenDownloads,
  onDeleteSelected,
}) {
  const available = options.filter((option) => !activeFilters.some((item) => item.key === option.key));
  return (
    <div className="space-y-2">
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Filtros ativos">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => onRemoveFilter(filter)}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-sm text-theme-main hover:bg-blue-500/20"
              aria-label={`Remover filtro ${filter.label}`}
              title="Remover filtro"
            >
              {filter.label}<X size={13} />
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value=""
          onChange={(event) => {
            const option = options.find((item) => item.key === event.target.value);
            if (option) onAddFilter(option);
          }}
          className="flex-1 min-w-48 px-3 py-2 bg-[var(--p-header-bg)] border border-[var(--p-border)] rounded-lg text-sm text-theme-main focus:outline-none focus:border-blue-500/50"
          aria-label="Adicionar filtro de EPI ou estado de alerta"
        >
          <option value="">Filtrar por EPI ou estado de alerta</option>
          <optgroup label="EPIs">
            {available.filter((item) => item.type === 'epi').map((item) => (
              <option key={item.key} value={item.key}>{item.label}</option>
            ))}
          </optgroup>
          <optgroup label="Estado de alerta">
            {available.filter((item) => item.type === 'alert').map((item) => (
              <option key={item.key} value={item.key}>{item.label}</option>
            ))}
          </optgroup>
        </select>
        <select
          value={source}
          onChange={(event) => onSourceChange(event.target.value)}
          className="px-3 py-2 bg-[var(--p-header-bg)] border border-[var(--p-border)] rounded-lg text-sm text-theme-main focus:outline-none focus:border-blue-500/50"
          aria-label="Filtrar por fonte ou câmera"
        >
          <option value="">Todas as fontes</option>
          {sources.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select
          value={camera}
          onChange={(event) => onCameraChange(event.target.value)}
          className="px-3 py-2 bg-[var(--p-header-bg)] border border-[var(--p-border)] rounded-lg text-sm text-theme-main focus:outline-none focus:border-blue-500/50"
          aria-label="Filtrar por câmera"
        >
          <option value="">Todas as câmeras</option>
          {cameras.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button
          type="button"
          onClick={onToggleAlerts}
          aria-pressed={onlyAlerts}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${onlyAlerts
            ? 'bg-red-500/20 border-red-500/40 text-red-500 font-semibold'
            : 'bg-[var(--p-header-bg)] border-[var(--p-border)] text-theme-muted hover:text-theme-main'}`}
        >
          <Filter size={14} /> Só alertas
        </button>
        <button
          type="button"
          onClick={onToggleSelectAll}
          disabled={filteredCount === 0}
          aria-pressed={allFilteredSelected}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-[var(--p-border)] bg-[var(--p-header-bg)] text-theme-main hover:border-blue-500/50 disabled:opacity-40"
        >
          <ListChecks size={15} /> {allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos'}
        </button>
        <button
          type="button"
          onClick={onOpenDownloads}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-[var(--p-border)] bg-[var(--p-header-bg)] text-theme-main hover:border-blue-500/50"
        >
          <Download size={15} /> Downloads
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={selectedCount === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-red-500/40 bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-40"
        >
          <Trash2 size={15} /> Deletar selecionados
        </button>
        <span className="text-sm text-theme-muted" aria-live="polite">{selectedCount} selecionados</span>
      </div>
    </div>
  );
}

export default IncidentFilters;
