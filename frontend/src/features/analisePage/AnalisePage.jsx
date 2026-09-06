import React, { useState } from 'react';
import { Sparkles, Server, Brain, ShieldCheck } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import { useAnaliseData } from '../../hooks/useAnaliseData';
import {
  AnalisePageSkeleton,
  MlSection,
  SistemaSection,
  ConfiabilidadeSection,
} from './components';

const SECTIONS = [
  { id: 'sistema', label: '1. Sistema & Performance', icon: Server },
  { id: 'ml', label: '2. Desempenho do ML', icon: Brain },
  { id: 'confiabilidade', label: '3. Confiabilidade & IA', icon: ShieldCheck },
];

export function AnalisePage() {
  const currentTheme = useUiStore((s) => s.theme);
  const [activeSection, setActiveSection] = useState('sistema');
  const [currentThread, setCurrentThread] = useState('backend_processor');

  const { data, loading } = useAnaliseData(currentThread, 15000);

  if (loading) {
    return <AnalisePageSkeleton />;
  }

  return (
    <div className={`panel-theme-${currentTheme} min-h-screen w-full transition-colors duration-300 font-sans`}>
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* HEADER DA PÁGINA */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-theme-divider pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wider uppercase text-[var(--p-text-title)]">
              Análise Avançada de Telemetria e IA
            </h1>
          </div>

          {/* NAVEGAÇÃO ENTRE SEÇÕES */}
          <div className="flex p-1 rounded-xl border border-theme-divider panel-card">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'panel-btn-toggle font-bold shadow-md'
                      : 'text-[var(--p-text-muted)] hover:opacity-80'
                  }`}
                >
                  <Icon size={14} />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* CONTEÚDO DAS SEÇÕES */}
        <div className="space-y-8">
          {activeSection === 'sistema' && (
            <SistemaSection
              detStats={data?.detStats}
              currentThread={currentThread}
              onThreadChange={setCurrentThread}
              theme={currentTheme}
            />
          )}

          {activeSection === 'ml' && (
            <MlSection
              detStats={data?.detStats}
              latencyLogs={data?.latencyLogs}
              radarData={data?.radarData}
              theme={currentTheme}
            />
          )}

          {activeSection === 'confiabilidade' && (
            <ConfiabilidadeSection
              confusionData={data?.confusionMatrix}
              confidenceData={data?.detStats?.confidence ?? []}
              theme={currentTheme}
            />
          )}
        </div>

      </main>
    </div>
  );
}

export default AnalisePage;