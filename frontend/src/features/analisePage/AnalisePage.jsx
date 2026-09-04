import React, { useState } from 'react';
import { Sparkles, Server, Brain, ShieldCheck } from 'lucide-react';

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
  const [activeSection, setActiveSection] = useState('ml');
  const [currentThread, setCurrentThread] = useState('backend_processor');

  // Consome os dados reais integrados
  const { data, loading } = useAnaliseData(currentThread, 15000);

  if (loading) {
    return <AnalisePageSkeleton />;
  }

  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-8 flex flex-col font-sans transition-colors duration-300">
      {/* HEADER DA PÁGINA */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Sparkles size={14} /> Guia Executivo & Analytics Integrado
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Análise Avançada de Telemetria e IA
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Métricas em tempo real sobre gargalos do sistema, eficiência de inferência do ML e índices de confiabilidade.
          </p>
        </div>

        {/* NAVEGAÇÃO ENTRE SEÇÕES */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
      <main className="flex-1 flex flex-col gap-8">
        {activeSection === 'sistema' && (
          <SistemaSection
            detStats={data.detStats}
            currentThread={currentThread}
            onThreadChange={setCurrentThread}
          />
        )}

        {activeSection === 'ml' && (
          <MlSection
            detStats={data.detStats}
            latencyLogs={data.latencyLogs}
            radarData={data.radarData}
          />
        )}

        {activeSection === 'confiabilidade' && (
          <ConfiabilidadeSection
            confusionData={data.confusionMatrix}
            confidenceData={data.detStats?.confidence ?? []}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-8 text-center text-xs text-slate-500 border-t border-slate-800/60 pt-4 flex items-center justify-between">
        <span>Painel de Análise Estruturada por Seções • Versão 2.0</span>
        <span className="text-slate-400">Sistema Operacional & Analytics</span>
      </footer>
    </div>
  );
}

export default AnalisePage;