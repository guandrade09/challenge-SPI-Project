import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import detectionService from '../../services/detectionService';
import { IncidentCard, IncidentFilters, IncidentModal } from './components';

const PAGE_SIZE = 20;

export default function IncidentesPage() {
  const currentTheme = useUiStore((s) => s.theme);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterAlert, setFilterAlert] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const payload = await detectionService.list();
        const items = (payload?.data || []).slice().reverse();
        setAll(items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sources = [...new Set(all.map((d) => d.source).filter(Boolean))];

  const filtered = all.filter((d) => {
    if (search && !d.label?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSource && d.source !== filterSource) return false;
    if (filterAlert) {
      const hasAlert = d.details?.zona?.some((z) => z.invadiu) ||
        d.details?.ergonomia?.some((p) => p.queda) ||
        d.details?.epi?.some((e) => e.label?.toLowerCase().includes('ausente'));
      if (!hasAlert) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const page_ = Math.min(page, Math.max(0, totalPages - 1));
  const pageItems = filtered.slice(page_ * PAGE_SIZE, (page_ + 1) * PAGE_SIZE);

  return (
    <div className={`panel-theme-${currentTheme} min-h-screen w-full transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl text-[var(--p-text)] uppercase tracking-wider font-semibold">
              Histórico de Incidentes
            </h2>
            <p className="text-xs text-neutral-500 mt-1">{filtered.length} registros encontrados</p>
          </div>
        </div>

        {/* Filtros */}
        <IncidentFilters
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(0); }}
          source={filterSource}
          onSourceChange={(v) => { setFilterSource(v); setPage(0); }}
          sources={sources}
          onlyAlerts={filterAlert}
          onToggleAlerts={() => { setFilterAlert((p) => !p); setPage(0); }}
        />

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="bg-[#1c1d26] rounded-xl h-52 animate-pulse" />
            ))}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="text-center py-24 text-neutral-500">Nenhum incidente encontrado.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pageItems.map((incident, i) => (
              <IncidentCard key={`${incident.timestamp}-${i}`} incident={incident} onClick={setSelected} />
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page_ === 0}
              className="p-2 rounded-lg border border-white/10 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-neutral-400 font-mono">
              {page_ + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page_ === totalPages - 1}
              className="p-2 rounded-lg border border-white/10 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {selected && <IncidentModal incident={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}