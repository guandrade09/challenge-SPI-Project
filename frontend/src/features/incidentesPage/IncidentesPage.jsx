import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import detectionService from '../../services/detectionService';
import { IncidentCard, IncidentFilters, IncidentModal } from './components';
import IncidentDownloadModal from './components/IncidentDownloadModal';
import IncidentDeleteModal from './components/IncidentDeleteModal';
import { groupIncidentRows, incidentKey } from './utils/groupIncidents';
import { filterIncidents, getFilterOptions } from './utils/incidentFiltering';
import { downloadIncidentsZip } from './utils/incidentExport';

const PAGE_SIZE = 20;

export default function IncidentesPage() {
  const currentTheme = useUiStore((s) => s.theme);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState([]);
  const [filterSource, setFilterSource] = useState('');
  const [filterCamera, setFilterCamera] = useState('');
  const [filterAlert, setFilterAlert] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [deleteTargets, setDeleteTargets] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteNotice, setDeleteNotice] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const payload = await detectionService.list();
        const rawItems = Array.isArray(payload) ? payload : payload?.data || payload?.incidents || [];
        if (mounted) setAll(groupIncidentRows(rawItems.slice().reverse()));
      } catch (err) {
        console.error('Erro ao carregar incidentes:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const sources = useMemo(() => [...new Set(all.map((d) => d.source).filter(Boolean))], [all]);
  const cameras = useMemo(() => [...new Set(all.map((d) => d.camera_id).filter(Boolean))], [all]);
  const options = useMemo(() => getFilterOptions(all), [all]);
  const filtered = useMemo(
    () => filterIncidents(all, activeFilters, filterSource, filterAlert, filterCamera),
    [all, activeFilters, filterSource, filterAlert, filterCamera],
  );
  const selectedFiltered = filtered.filter((incident) => selectedKeys.has(incidentKey(incident)));
  const allFilteredSelected = filtered.length > 0 && selectedFiltered.length === filtered.length;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const page_ = Math.min(page, Math.max(0, totalPages - 1));
  const pageItems = filtered.slice(page_ * PAGE_SIZE, (page_ + 1) * PAGE_SIZE);

  const changeFilters = (next) => {
    setActiveFilters(next);
    setSelectedKeys(new Set());
    setPage(0);
  };
  const toggleIncident = (incident) => {
    const key = incidentKey(incident);
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const toggleAll = () => setSelectedKeys(allFilteredSelected
    ? new Set()
    : new Set(filtered.map(incidentKey)));
  const handleDownload = async (mode) => {
    if (downloadBusy || selectedFiltered.length === 0) return;
    setDownloadBusy(true);
    setDownloadError('');
    try {
      await downloadIncidentsZip(selectedFiltered, mode);
      setDownloadOpen(false);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Não foi possível gerar o ZIP.');
    } finally {
      setDownloadBusy(false);
    }
  };
  const openDelete = (incidents) => {
    if (!incidents.length) return;
    if (incidents.some((incident) => !Number.isSafeInteger(incident.id))) {
      setDeleteNotice('Não foi possível identificar os incidentes. Recarregue a página.');
      return;
    }
    setDeleteNotice('');
    setDeleteError('');
    setDeleteTargets(incidents);
  };
  const handleDelete = async () => {
    if (!deleteTargets?.length || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      const ids = deleteTargets.map((incident) => incident.id);
      const result = await detectionService.remove(ids);
      const keys = new Set(deleteTargets.map(incidentKey));
      setAll((current) => current.filter((incident) => !keys.has(incidentKey(incident))));
      setSelectedKeys((current) => new Set([...current].filter((key) => !keys.has(key))));
      if (selected && keys.has(incidentKey(selected))) setSelected(null);
      setDeleteNotice(result.filesNotRemoved
        ? `Incidentes removidos do banco; ${result.filesNotRemoved} arquivo(s) não puderam ser removidos do servidor.`
        : '');
      setDeleteTargets(null);
    } catch (error) {
      setDeleteError(error.response?.data?.error || error.message || 'Não foi possível deletar os incidentes.');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className={`panel-theme-${currentTheme} min-h-screen w-full transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl text-[var(--p-text-title)] font-theme-title">Histórico de Incidentes</h2>
            <p className="text-[var(--p-text-title)] mt-1">{filtered.length} registros encontrados</p>
          </div>
        </div>
        {deleteNotice && <p role="status" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-theme-main">{deleteNotice}</p>}
        <IncidentFilters
          activeFilters={activeFilters}
          options={options}
          onAddFilter={(filter) => changeFilters([...activeFilters, filter])}
          onRemoveFilter={(filter) => changeFilters(activeFilters.filter((item) => item.key !== filter.key))}
          source={filterSource}
          onSourceChange={(value) => { setFilterSource(value); setSelectedKeys(new Set()); setPage(0); }}
          sources={sources}
          camera={filterCamera}
          cameras={cameras}
          onCameraChange={(value) => { setFilterCamera(value); setSelectedKeys(new Set()); setPage(0); }}
          onlyAlerts={filterAlert}
          onToggleAlerts={() => { setFilterAlert((value) => !value); setSelectedKeys(new Set()); setPage(0); }}
          selectedCount={selectedFiltered.length}
          filteredCount={filtered.length}
          allFilteredSelected={allFilteredSelected}
          onToggleSelectAll={toggleAll}
          onOpenDownloads={() => { setDownloadError(''); setDownloadOpen(true); }}
          onDeleteSelected={() => openDelete(selectedFiltered)}
        />
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <div key={i} className="panel-subcard h-52 animate-pulse" />)}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="text-center py-24 text-theme-muted">Nenhum incidente encontrado.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pageItems.map((incident) => (
              <IncidentCard
                key={incidentKey(incident)}
                incident={incident}
                onClick={setSelected}
                isSelected={selectedKeys.has(incidentKey(incident))}
                onToggleSelect={() => toggleIncident(incident)}
                onDelete={(item) => openDelete([item])}
              />
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page_ === 0} className="icon-btn-ghost disabled:opacity-30" aria-label="Página anterior"><ChevronLeft size={16} /></button>
            <span className="text-sm text-[var(--p-text-title)] font-mono">{page_ + 1} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page_ === totalPages - 1} className="icon-btn-ghost disabled:opacity-30" aria-label="Próxima página"><ChevronRight size={16} /></button>
          </div>
        )}
      </main>
      {selected && <IncidentModal incident={selected} onClose={() => setSelected(null)} />}
      {downloadOpen && (
        <IncidentDownloadModal
          selectedCount={selectedFiltered.length}
          busy={downloadBusy}
          error={downloadError}
          onClose={() => { if (!downloadBusy) setDownloadOpen(false); }}
          onDownload={handleDownload}
        />
      )}
      {deleteTargets && (
        <IncidentDeleteModal
          count={deleteTargets.length}
          busy={deleteBusy}
          error={deleteError}
          onClose={() => { if (!deleteBusy) setDeleteTargets(null); }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
