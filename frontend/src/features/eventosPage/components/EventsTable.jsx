import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Filter, X, Check, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';

const ITEMS_PER_PAGE = 10;
const STATUS_TABS = ['Todos', 'Pendente', 'Validado', 'Descartado'];

export function EventsTable({ events, selectedEventId, onSelectEvent }) {
  // Estados para os filtros das colunas
  const [filters, setFilters] = useState({
    status: 'Todos',
    origem: 'Todos',
    horaInicio: '',
    horaFim: '',
    ordemHorario: 'desc', // 'asc' (mais antigo) ou 'desc' (mais recente)
    tipo: '',
    gravidade: 'Todas',
    setorCamera: '',
  });

  // Estado da Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  // Controle do menu popover de filtro aberto
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Reseta para a página 1 quando os filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Fecha o popover ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (colKey, e) => {
    e.stopPropagation();
    setOpenDropdown((prev) => (prev === colKey ? null : colKey));
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'Todos',
      origem: 'Todos',
      horaInicio: '',
      horaFim: '',
      ordemHorario: 'desc',
      tipo: '',
      gravidade: 'Todas',
      setorCamera: '',
    });
    setOpenDropdown(null);
  };

  // 1. Aplica Filtros e Ordenação
  const filteredEvents = useMemo(() => {
    const filtered = events.filter((evt) => {
      if (filters.status !== 'Todos' && evt.status !== filters.status) return false;
      if (filters.origem !== 'Todos' && evt.origem !== filters.origem) return false;

      if (filters.horaInicio || filters.horaFim) {
        const timeMatch = evt.timestamp?.match(/\d{2}:\d{2}/);
        if (timeMatch) {
          const eventTime = timeMatch[0];
          if (filters.horaInicio && eventTime < filters.horaInicio) return false;
          if (filters.horaFim && eventTime > filters.horaFim) return false;
        }
      }

      if (filters.tipo.trim() !== '') {
        const queryTipo = filters.tipo.toLowerCase();
        const matchTipo = evt.tipo?.toLowerCase().includes(queryTipo);
        const matchId = String(evt.id).toLowerCase().includes(queryTipo);
        if (!matchTipo && !matchId) return false;
      }

      if (filters.gravidade !== 'Todas' && evt.gravidade !== filters.gravidade) return false;

      if (filters.setorCamera.trim() !== '') {
        const querySetor = filters.setorCamera.toLowerCase();
        const matchSetor = evt.setor?.toLowerCase().includes(querySetor);
        const matchCamera = evt.camera?.toLowerCase().includes(querySetor) || evt.nome?.toLowerCase().includes(querySetor);
        if (!matchSetor && !matchCamera) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      const timeA = a.timestamp || '';
      const timeB = b.timestamp || '';
      if (filters.ordemHorario === 'asc') {
        return timeA.localeCompare(timeB);
      }
      return timeB.localeCompare(timeA);
    });
  }, [events, filters]);

  // 2. Paginação e Cálculos de Exibição
  const totalItems = filteredEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  // Sincroniza o valor do input numérico com a página atual válida
  useEffect(() => {
    setPageInput(String(safeCurrentPage));
  }, [safeCurrentPage]);

  // Validação do Input Numérico de Página
  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = () => {
    const parsedPage = parseInt(pageInput, 10);
    if (!isNaN(parsedPage)) {
      // Clampa o valor digitado entre 1 e totalPages
      const validPage = Math.min(Math.max(parsedPage, 1), totalPages);
      setCurrentPage(validPage);
      setPageInput(String(validPage));
    } else {
      // Em caso de valor inválido ou em branco, restaura a página atual
      setPageInput(String(safeCurrentPage));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
    }
  };

  const paginatedEvents = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, safeCurrentPage]);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(safeCurrentPage * ITEMS_PER_PAGE, totalItems);

  // Filtros ativos extras
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'Todos') count++;
    if (filters.origem !== 'Todos') count++;
    if (filters.horaInicio || filters.horaFim) count++;
    if (filters.ordemHorario !== 'desc') count++;
    if (filters.tipo.trim() !== '') count++;
    if (filters.gravidade !== 'Todas') count++;
    if (filters.setorCamera.trim() !== '') count++;
    return count;
  }, [filters]);

  return (
    <Card className="lg:col-span-2 shadow-md flex flex-col justify-between">
      <div className="flex flex-col flex-1">
        {/* HEADER UNIFICADO EM UMA FILEIRA (ESQUERDA: FILTROS / DIREITA: PAGINAÇÃO E ABAS) */}
        <CardHeader className="flex flex-row items-center justify-between gap-4 py-2.5 px-4 border-b border-theme-divider overflow-x-auto custom-scrollbar">
          
          {/* LADO ESQUERDO: ABAS DE STATUS + CONTADOR + LIMPAR FILTROS */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Abas de Navegação por Status */}
            <div className="flex items-center gap-1 bg-[var(--p-bg)] p-1 rounded-lg border border-theme-divider">
              {STATUS_TABS.map((tab) => {
                const isActive = filters.status === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setFilters((f) => ({ ...f, status: tab }))}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-theme-accent text-white shadow-sm font-semibold'
                        : 'text-theme-muted hover:text-theme-main hover:bg-theme-hover'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Contador de Exibição */}
            <span className="text-xs text-theme-muted font-mono bg-[var(--p-bg)] px-2.5 py-1 rounded-md border border-theme-divider whitespace-nowrap hidden sm:inline-block">
              <strong className="text-theme-main">{startItem}–{endItem}</strong> de{' '}
              <strong className="text-theme-main">{totalItems}</strong>
            </span>

            {/* Botão de Limpar Filtros */}
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors whitespace-nowrap"
              >
                <X size={12} /> Limpar ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* LADO DIREITO: PESQUISA POR INPUT NUMÉRICO + SETAS DE NAVEGAÇÃO + ABAS DE PÁGINAS */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* INPUT NUMÉRICO PARA INSERIR A PÁGINA COM VALIDAÇÃO */}
            <div className="flex items-center gap-1.5 bg-[var(--p-bg)] px-2 py-1 rounded-lg border border-theme-divider text-xs text-theme-muted">
              <span>Pág.</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={handlePageInputChange}
                onBlur={handlePageInputSubmit}
                onKeyDown={handleKeyDown}
                className="w-10 h-6 text-center text-xs font-mono font-bold bg-[var(--p-header-bg)] border border-theme-divider rounded text-theme-main focus:outline-none focus:border-theme-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                title={`Insira uma página entre 1 e ${totalPages}`}
              />
              <span>de <strong className="text-theme-main font-mono">{totalPages}</strong></span>
            </div>

            {/* CONTROLES COM SETAS E NAVEGAÇÃO */}
            <div className="flex items-center gap-1 bg-[var(--p-bg)] p-1 rounded-lg border border-theme-divider">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={safeCurrentPage === 1}
                className="p-1 rounded-md hover:bg-theme-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-theme-main"
                title="Página Anterior"
              >
                <ChevronLeft size={16} />
              </button>

              {/* ABAS RÁPIDAS DAS PÁGINAS */}
              <div className="flex items-center gap-0.5 px-0.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1)
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="text-xs text-theme-muted px-0.5">..</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[24px] h-6 text-xs font-mono rounded transition-all ${
                            safeCurrentPage === page
                              ? 'bg-theme-accent text-white font-bold shadow-sm'
                              : 'text-theme-muted hover:text-theme-main hover:bg-theme-hover'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={safeCurrentPage === totalPages}
                className="p-1 rounded-md hover:bg-theme-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-theme-main"
                title="Próxima Página"
              >
                <ChevronRight size={16} />
              </button>
            </div>

          </div>
        </CardHeader>

        {/* TABELA DE OCORRÊNCIAS */}
        <div className="overflow-x-auto flex-1 custom-scrollbar p-2" ref={dropdownRef}>
          <Table className="border-separate border-spacing-y-1.5 min-w-full">
            <TableHeader className="border-none">
              <TableRow className="hover:bg-transparent">
                {/* STATUS */}
                <TableHead className="py-2 px-4 relative">
                  <div className="flex items-center justify-between gap-1">
                    <span>Status</span>
                  </div>
                </TableHead>

                {/* ORIGEM */}
                <TableHead className="py-2 px-4 relative">
                  <div className="flex items-center justify-between gap-1">
                    <span>Origem</span>
                    <button
                      onClick={(e) => toggleDropdown('origem', e)}
                      className={`p-1 rounded hover:bg-theme-hover transition-colors ${
                        filters.origem !== 'Todos'
                          ? 'text-purple-400 font-bold bg-purple-500/10'
                          : 'text-theme-muted hover:text-theme-main'
                      }`}
                      title="Filtrar por Origem"
                    >
                      <Filter size={13} />
                    </button>
                  </div>

                  {openDropdown === 'origem' && (
                    <div className="absolute top-full left-0 mt-1 w-36 bg-[var(--p-header-bg)] border border-theme-divider rounded-xl shadow-xl p-2 z-50 text-xs font-normal">
                      <span className="text-[10px] uppercase font-bold text-theme-muted px-2 block mb-1">
                        Filtrar Origem
                      </span>
                      {['Todos', 'Detecção', 'Log'].map((ori) => (
                        <button
                          key={ori}
                          onClick={() => {
                            setFilters((f) => ({ ...f, origem: ori }));
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-theme-hover ${
                            filters.origem === ori
                              ? 'text-theme-accent font-bold bg-theme-hover/50'
                              : 'text-theme-main'
                          }`}
                        >
                          {ori}
                          {filters.origem === ori && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  )}
                </TableHead>

                {/* HORÁRIO */}
                <TableHead className="py-2 px-4 relative">
                  <div className="flex items-center justify-between gap-1">
                    <span>Horário</span>
                    <button
                      onClick={(e) => toggleDropdown('horario', e)}
                      className={`p-1 rounded hover:bg-theme-hover transition-colors ${
                        filters.horaInicio || filters.horaFim || filters.ordemHorario !== 'desc'
                          ? 'text-amber-400 font-bold bg-amber-500/10'
                          : 'text-theme-muted hover:text-theme-main'
                      }`}
                      title="Filtrar / Ordenar Horário"
                    >
                      <Filter size={13} />
                    </button>
                  </div>

                  {openDropdown === 'horario' && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--p-header-bg)] border border-theme-divider rounded-xl shadow-xl p-3 z-50 text-xs font-normal flex flex-col gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-theme-muted block mb-1.5">
                          Ordem de Exibição
                        </span>
                        <div className="grid grid-cols-2 gap-1 bg-[var(--p-bg)] p-1 rounded-lg border border-theme-divider">
                          <button
                            onClick={() => setFilters((f) => ({ ...f, ordemHorario: 'desc' }))}
                            className={`flex items-center justify-center gap-1 py-1 px-2 rounded text-[11px] font-medium transition-colors ${
                              filters.ordemHorario === 'desc'
                                ? 'bg-theme-accent text-white font-bold'
                                : 'text-theme-muted hover:text-theme-main'
                            }`}
                          >
                            <ArrowDown size={12} /> Decrescente
                          </button>
                          <button
                            onClick={() => setFilters((f) => ({ ...f, ordemHorario: 'asc' }))}
                            className={`flex items-center justify-center gap-1 py-1 px-2 rounded text-[11px] font-medium transition-colors ${
                              filters.ordemHorario === 'asc'
                                ? 'bg-theme-accent text-white font-bold'
                                : 'text-theme-muted hover:text-theme-main'
                            }`}
                          >
                            <ArrowUp size={12} /> Crescente
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-theme-muted block mb-1.5">
                          Intervalo (HH:MM)
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-theme-muted">De:</label>
                            <input
                              type="time"
                              value={filters.horaInicio}
                              onChange={(e) => setFilters((f) => ({ ...f, horaInicio: e.target.value }))}
                              className="p-1 rounded bg-[var(--p-bg)] border border-theme-divider text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-theme-muted">Até:</label>
                            <input
                              type="time"
                              value={filters.horaFim}
                              onChange={(e) => setFilters((f) => ({ ...f, horaFim: e.target.value }))}
                              className="p-1 rounded bg-[var(--p-bg)] border border-theme-divider text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TableHead>

                {/* OCORRÊNCIA */}
                <TableHead className="py-2 px-4 relative">
                  <div className="flex items-center justify-between gap-1">
                    <span>Ocorrência</span>
                    <button
                      onClick={(e) => toggleDropdown('tipo', e)}
                      className={`p-1 rounded hover:bg-theme-hover transition-colors ${
                        filters.tipo !== '' || filters.gravidade !== 'Todas'
                          ? 'text-blue-400 font-bold bg-blue-500/10'
                          : 'text-theme-muted hover:text-theme-main'
                      }`}
                      title="Filtrar por Nome / Gravidade"
                    >
                      <Filter size={13} />
                    </button>
                  </div>

                  {openDropdown === 'tipo' && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--p-header-bg)] border border-theme-divider rounded-xl shadow-xl p-3 z-50 text-xs font-normal flex flex-col gap-2">
                      <span className="text-[10px] uppercase font-bold text-theme-muted block">
                        Buscar Ocorrência ou ID
                      </span>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ex: Sem Capacete, #102..."
                          value={filters.tipo}
                          onChange={(e) => setFilters((f) => ({ ...f, tipo: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--p-bg)] border border-theme-divider text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                        />
                      </div>

                      <span className="text-[10px] uppercase font-bold text-theme-muted block mt-1">
                        Gravidade
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        {['Todas', 'alta', 'media', 'baixa'].map((grav) => (
                          <button
                            key={grav}
                            onClick={() => setFilters((f) => ({ ...f, gravidade: grav }))}
                            className={`px-2 py-1 rounded text-[11px] capitalize text-center ${
                              filters.gravidade === grav
                                ? 'bg-theme-accent text-white font-bold'
                                : 'bg-[var(--p-bg)] hover:bg-theme-hover text-theme-muted'
                            }`}
                          >
                            {grav}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </TableHead>

                {/* SETOR / CÂMERA */}
                <TableHead className="py-2 px-4 relative">
                  <div className="flex items-center justify-between gap-1">
                    <span>Setor / Câmera</span>
                    <button
                      onClick={(e) => toggleDropdown('setor', e)}
                      className={`p-1 rounded hover:bg-theme-hover transition-colors ${
                        filters.setorCamera !== ''
                          ? 'text-emerald-400 font-bold bg-emerald-500/10'
                          : 'text-theme-muted hover:text-theme-main'
                      }`}
                      title="Filtrar por Setor ou Câmera"
                    >
                      <Filter size={13} />
                    </button>
                  </div>

                  {openDropdown === 'setor' && (
                    <div className="absolute top-full right-0 mt-1 w-52 bg-[var(--p-header-bg)] border border-theme-divider rounded-xl shadow-xl p-3 z-50 text-xs font-normal">
                      <span className="text-[10px] uppercase font-bold text-theme-muted block mb-2">
                        Filtrar Setor ou Câmera
                      </span>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ex: Galpão A, CAM-02..."
                          value={filters.setorCamera}
                          onChange={(e) => setFilters((f) => ({ ...f, setorCamera: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--p-bg)] border border-theme-divider text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                        />
                      </div>
                    </div>
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y-0">
              {paginatedEvents.length > 0 ? (
                paginatedEvents.map((evt) => {
                  const isSelected = String(evt.id) === String(selectedEventId);
                  const isDetection = evt.origem === 'Detecção';

                  return (
                    <TableRow
                      key={evt.id}
                      onClick={() => onSelectEvent(evt.id)}
                      className={`group cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-[var(--p-header-bg)] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.35)] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.7)] ring-1 ring-[var(--p-subtext)]/40 -translate-y-[1px]'
                          : 'bg-transparent hover:bg-[var(--p-header-bg)]/50 hover:shadow-sm'
                      }`}
                    >
                      {/* Status */}
                      <TableCell className="py-3 px-4 rounded-l-xl">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                            evt.status === 'Pendente'
                              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                              : evt.status === 'Validado'
                              ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                              : 'badge-theme-industrial'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              evt.status === 'Pendente'
                                ? 'bg-amber-500 animate-pulse'
                                : evt.status === 'Validado'
                                ? 'bg-emerald-500'
                                : 'bg-neutral-400'
                            }`}
                          />
                          {evt.status}
                        </span>
                      </TableCell>

                      {/* Origem */}
                      <TableCell className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                            isDetection
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {evt.origem}
                        </span>
                      </TableCell>

                      {/* Horário */}
                      <TableCell className="py-3 px-4 text-xs font-mono text-theme-muted">
                        {evt.timestamp}
                      </TableCell>

                      {/* Ocorrência */}
                      <TableCell className="py-3 px-4 font-medium text-theme-main">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              evt.gravidade === 'alta'
                                ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                                : evt.gravidade === 'media'
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                          />
                          <span className="truncate">{evt.tipo}</span>
                        </div>
                      </TableCell>

                      {/* Setor / Câmera */}
                      <TableCell className="py-3 px-4 rounded-r-xl">
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-theme-main">
                            {evt.setor}
                          </span>
                          <span className="text-[10px] font-mono text-theme-muted">
                            {evt.nome || evt.camera}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-theme-muted text-xs">
                    Nenhum registro encontrado para os filtros selecionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}

export default EventsTable;