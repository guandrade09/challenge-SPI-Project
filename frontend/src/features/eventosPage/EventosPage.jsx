import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import { eventService } from '../../services/eventService';
import { EventValidationModal } from './components/EventValidationModal';
import { EventDeleteModal } from './components/EventDeleteModal';
import { EventLogModal } from './components/EventLogModal';
import { getPendingValidationEvents } from '../../utils/eventValidation';
import { 
  EventMetricsCard, 
  EventsTable, 
  CriticalActionCard, 
  EventDetailsCard,
  EventosPageSkeleton 
} from './components';

const areEventsEqual = (a, b) => a.length === b.length && a.every((item, index) => {
  const next = b[index];
  return ['id', 'deleteId', 'origem', 'status', 'timestamp', 'tipo', 'gravidade', 'setor', 'camera', 'nome', 'imagem', 'imagemLateral', 'imagemSource', 'imagemLateralSource', 'detectionDetails', 'detalhes', 'analise', 'label', 'confidence', 'urgency', 'epi_ausente', 'reba_nivel']
    .every((field) => JSON.stringify(item[field]) === JSON.stringify(next?.[field]));
});

export function EventosPage() {
  const currentTheme = useUiStore((s) => s.theme);
  
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [validationEvent, setValidationEvent] = useState(null);
  const [deleteEvent, setDeleteEvent] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteNotice, setDeleteNotice] = useState('');
  
  const eventsRef = useRef([]);
  const validationOverridesRef = useRef(new Map());
  const fetchVersionRef = useRef(0);
  const hasLoadedRef = useRef(false);

  const fetchEvents = useCallback(async () => {
    const version = ++fetchVersionRef.current;
    const isFirstLoad = !hasLoadedRef.current;
    if (isFirstLoad) setIsLoading(true);

    try {
      const incomingEvents = await eventService.listEvents();
      if (version !== fetchVersionRef.current) return;
      const realEvents = incomingEvents.map((event) => {
        const validatedStatus = validationOverridesRef.current.get(`${event.origem}:${event.id}`);
        return validatedStatus ? { ...event, status: validatedStatus } : event;
      });

      if (!areEventsEqual(eventsRef.current, realEvents)) {
        eventsRef.current = realEvents;
        setEvents(realEvents);
      }
    } catch (error) {
      console.error("Erro ao buscar eventos/logs em tempo real:", error);
      if (version === fetchVersionRef.current && eventsRef.current.length === 0) {
        setEvents([]);
      }
    } finally {
      if (isFirstLoad && version === fetchVersionRef.current) {
        hasLoadedRef.current = true;
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;

  const handleValidateEvent = (id, newStatus) => {
    const event = eventsRef.current.find((item) => item.id === id);
    if (event) validationOverridesRef.current.set(`${event.origem}:${id}`, newStatus);
    setEvents((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
      eventsRef.current = updated;
      return updated;
    });
  };

  const handleDeleteEvent = async () => {
    if (!deleteEvent || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      const result = await eventService.remove(deleteEvent);
      // Uma leitura iniciada antes da exclusão não deve restaurar o registro na tela.
      fetchVersionRef.current += 1;
      const key = `${deleteEvent.origem}:${deleteEvent.id}`;
      validationOverridesRef.current.delete(key);
      const updated = eventsRef.current.filter((event) => `${event.origem}:${event.id}` !== key);
      eventsRef.current = updated;
      setEvents(updated);
      if (selectedEventId === deleteEvent.id) setSelectedEventId(null);
      if (validationEvent?.id === deleteEvent.id && validationEvent?.origem === deleteEvent.origem) setValidationEvent(null);
      setDeleteNotice(result.filesNotRemoved
        ? 'Ocorrência excluída. O arquivo do frame não pôde ser removido do servidor.'
        : 'Ocorrência excluída.');
      setDeleteEvent(null);
    } catch (error) {
      setDeleteError(error.response?.data?.error || error.message || 'Não foi possível excluir a ocorrência.');
    } finally {
      setDeleteBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`panel-theme-${currentTheme} min-h-screen w-full transition-colors duration-300`}>
        <EventosPageSkeleton />
      </div>
    );
  }

  return (
    <div className={`panel-theme-${currentTheme} w-full min-h-screen flex flex-col gap-6 p-4 sm:p-6 transition-colors duration-300 font-theme-body text-[var(--p-text)]`}>
      
      {/* 1. HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme-divider pb-4">
        <div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 2vw, 1.6rem)', margin: 0 }} className="text-[var(--p-text-title)] font-theme-title">
            Central de Eventos & Ocorrências
          </h1>
        </div>
      </header>

      {deleteNotice && <p role="status" className="rounded-lg border border-theme-divider bg-[var(--p-header-bg)] px-3 py-2 text-sm text-theme-main">{deleteNotice}</p>}

      {/* 2. OS 4 INDICADORES (MÉTRICAS) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EventMetricsCard
          title="Total de Eventos"
          value={events.length}
          icon={Clock}
          colorClass="border-indigo bg-indigo-500/10 text-indigo-500"
          valueColorClass="text-[var(--p-text-subtitle)]"
        />
        <EventMetricsCard
          title="Pendentes de Validação"
          value={getPendingValidationEvents(events).length}
          icon={AlertTriangle}
          colorClass="border-amber bg-amber-500/10 text-amber-500"
          valueColorClass="text-amber-500"
        />
        <EventMetricsCard
          title="Eventos Críticos"
          value={events.filter((e) => e.gravidade === 'alta' || e.gravidade === 'critico').length}
          icon={ShieldAlert}
          colorClass="border-[var(--risk-alert-border)] bg-[var(--risk-alert-bg)] text-red-500"
          valueColorClass="text-red-500"
        />
        <EventMetricsCard
          title="Auditados / Validados"
          value={events.filter((e) => e.status === 'Validado').length}
          icon={CheckCircle2}
          colorClass="border-emerald bg-emerald-500/10 text-emerald-500"
          valueColorClass="text-emerald-500"
        />
      </section>

      {/* 3. CONTEÚDO PRINCIPAL */}
      <main data-testid="events-content" className="grid min-w-0 grid-cols-1 lg:grid-cols-3 items-start gap-6">
        <EventsTable
          events={events}
          selectedEventId={selectedEvent?.id}
          onSelectEvent={setSelectedEventId}
        />

        <section aria-label="Detalhes e validação de eventos" className="flex min-w-0 flex-col gap-6">

          <EventDetailsCard event={selectedEvent} onValidate={setValidationEvent} onDelete={(event) => {
            setDeleteError('');
            setDeleteNotice('');
            setDeleteEvent(event);
          }} />

          <CriticalActionCard
            events={events}
            onValidate={handleValidateEvent}
            selectedEventId={selectedEvent?.id}
          />
          
        </section>
      </main>
      {validationEvent?.origem === 'Log' && <EventLogModal event={validationEvent} onClose={() => setValidationEvent(null)} />}
      {validationEvent?.origem === 'Detecção' && (
        <EventValidationModal
          key={validationEvent.id}
          event={validationEvent}
          onClose={() => setValidationEvent(null)}
          onValidate={(id, status, payload) => {
            handleValidateEvent(id, status, payload);
            setValidationEvent(null);
          }}
        />
      )}
      {deleteEvent && <EventDeleteModal
        event={deleteEvent} busy={deleteBusy} error={deleteError}
        onClose={() => { if (!deleteBusy) setDeleteEvent(null); }} onConfirm={handleDeleteEvent}
      />}
    </div>
  );
}

export default EventosPage;
