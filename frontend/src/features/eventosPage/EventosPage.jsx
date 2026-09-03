import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import { eventService } from '../../services/eventService';
import { 
  EventMetricsCard, 
  EventsTable, 
  CriticalActionCard, 
  EventDetailsCard,
  EventosPageSkeleton 
} from './components';

export function EventosPage() {
  const currentTheme = useUiStore((s) => s.theme);
  
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);
  
  const eventsRef = useRef([]);

  const areEventsEqual = (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((item, index) => item.id === b[index]?.id && item.status === b[index]?.status);
  };

  const fetchEvents = async () => {
    const isFirstLoad = eventsRef.current.length === 0;
    if (isFirstLoad) setIsLoading(true);

    try {
      const realEvents = await eventService.listEvents();

      if (!areEventsEqual(eventsRef.current, realEvents)) {
        eventsRef.current = realEvents;
        setEvents(realEvents);
      }
    } catch (error) {
      console.error("Erro ao buscar eventos/logs em tempo real:", error);
      if (eventsRef.current.length === 0) {
        setEvents([]);
      }
    } finally {
      if (isFirstLoad) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;

  const handleValidateEvent = (id, newStatus) => {
    setEvents((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
      eventsRef.current = updated;
      return updated;
    });
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
          <h1 className="text-xl sm:text-2xl text-[var(--p-text-title)] font-theme-title">
            Central de Eventos & Ocorrências
          </h1>
        </div>
      </header>

      {/* 2. OS 4 INDICADORES (MÉTRICAS) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EventMetricsCard
          title="Total de Eventos"
          value={events.length}
          icon={Clock}
          colorClass="border-[var(--p-border)] bg-[var(--p-header-bg)] text-[var(--p-subtext)]"
        />
        <EventMetricsCard
          title="Pendentes de Validação"
          value={events.filter((e) => e.status === 'Pendente').length}
          icon={AlertTriangle}
          colorClass="border-amber-500/30 bg-amber-500/10 text-amber-500"
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
          colorClass="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
          valueColorClass="text-emerald-500"
        />
      </section>

      {/* 3. CONTEÚDO PRINCIPAL */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <EventsTable
          events={events}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
        />

        <section className="flex flex-col gap-6">

          <EventDetailsCard event={selectedEvent} />

          <CriticalActionCard
            events={events}
            onValidate={handleValidateEvent}
            selectedEventId={selectedEventId}
          />
          
        </section>
      </main>
    </div>
  );
}

export default EventosPage;