import React from 'react';
import { LogReportButton } from './LogReportButton';
import { LogSkeleton } from './LogSkeleton';

export const LogPanel = ({ logs = [] }) => {
  return (
    <div className="relative flex flex-col h-full min-h-0 overflow-hidden w-full">
      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-2 pb-24 custom-scrollbar">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div 
              key={index} 
              className="p-3 rounded-xl border-l-4 border-theme-divider shadow-sm transition-all duration-200"
              style={{ backgroundColor: 'var(--p-header-bg)' }}
            >
              <p className="text-main-theme font-mono text-[11px] leading-tight">
                <span className="text-muted-theme opacity-60">{log.timestamp}</span>
                <span className="text-theme-accent mx-1">|</span> 
                {log.message}
              </p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <LogSkeleton />
            <span className="mt-4 text-[10px] font-bold font-mono text-muted-theme uppercase tracking-widest animate-pulse">
              Aguardando Logs...
            </span>
          </div>
        )}
      </div>

      {/* O gradiente inferior agora desvanece suavemente usando a variável nativa de fundo do tema */}
      <div 
        className="absolute bottom-0 left-0 right-0 p-4 pt-12 shrink-0"
        style={{
          background: 'linear-gradient(to top, var(--p-bg) 0%, var(--p-bg) 70%, transparent 100%)'
        }}
      >
        <LogReportButton />
      </div>
    </div>
  );
};

export default LogPanel;