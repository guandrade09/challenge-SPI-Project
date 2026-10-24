import { Download, Filter, ListChecks, Trash2, X } from 'lucide-react';
import { capitalizeFilterText } from '../utils/incidentFiltering';

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
  timeRange,
  onTimeRangeChange,
  onClearFilters,
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
          aria-label="Adicionar filtro de EPI, urgência ou ergonomia"
        >
          <option value="">EPIs, Urgência e Ergonomia</option>
          <optgroup label="EPIs">
            {available.filter((item) => item.type === 'epi').map((item) => (
              <option key={item.key} value={item.key}>{item.label}</option>
            ))}
          </optgroup>
          <optgroup label="Urgência">
            {available.filter((item) => item.type === 'urgency').map((item) => (
              <option key={item.key} value={item.key}>{item.label}</option>
            ))}
          </optgroup>
          <optgroup label="Ergonomia">
            {available.filter((item) => item.type === 'ergonomics').map((item) => (
              <option key={item.key} value={item.key}>{item.label}</option>
            ))}
          </optgroup>
        </select>
        <select
          value={source}
          onChange={(event) => onSourceChange(event.target.value)}
          className="px-3 py-2 bg-[var(--p-header-bg)] border border-[var(--p-border)] rounded-lg text-sm text-theme-main focus:outline-none focus:border-blue-500/50"
          aria-label="Filtrar por fonte"
        >
          <option value="">Todas as fontes</option>
          {sources.map((item) => <option key={item} value={item}>{capitalizeFilterText(item)}</option>)}
        </select>
        <select
          value={camera}
          onChange={(event) => onCameraChange(event.target.value)}
          className="px-3 py-2 bg-[var(--p-header-bg)] border border-[var(--p-border)] rounded-lg text-sm text-theme-main focus:outline-none focus:border-blue-500/50"
          aria-label="Filtrar por câmera"
        >
          <option value="">Todas as câmeras</option>
          {cameras.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="flex flex-col gap-1 text-xs text-theme-muted">
          De (data e hora)
          <input
            type="datetime-local"
            value={timeRange.start}
            max={timeRange.end || undefined}
            onChange={(event) => onTimeRangeChange({ ...timeRange, start: event.target.value })}
            className="min-w-0 max-w-full px-3 py-2 bg-[var(--p-header-bg)] border border-[var(--p-border)] rounded-lg text-sm text-theme-main focus:outline-none focus:border-blue-500/50"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-theme-muted">
          Até (data e hora)
          <input
            type="datetime-local"
            value={timeRange.end}
            min={timeRange.start || undefined}
            onChange={(event) => onTimeRangeChange({ ...timeRange, end: event.target.value })}
            className="min-w-0 max-w-full px-3 py-2 bg-[var(--p-header-bg)] border border-[var(--p-border)] rounded-lg text-sm text-theme-main focus:outline-none focus:border-blue-500/50"
          />
        </label>
        <button type="button" onClick={onClearFilters}
          disabled={!activeFilters.length && !source && !camera && !onlyAlerts && !timeRange.start && !timeRange.end}
          className="px-3 py-2 rounded-lg text-sm border border-[var(--p-border)] text-theme-muted hover:text-theme-main disabled:opacity-40">
          Limpar filtros
        </button>
      </div>
      {timeRange.start && timeRange.end && timeRange.start > timeRange.end && (
        <p role="alert" className="text-sm text-red-500">A data inicial deve ser anterior à data final.</p>
      )}
      <p className="text-xs text-theme-muted">Opções do mesmo grupo ampliam a busca; grupos diferentes, fonte, câmera e período são combinados.</p>
      <div className="flex flex-wrap gap-3 items-center">
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
