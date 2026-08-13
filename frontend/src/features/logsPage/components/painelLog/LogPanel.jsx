import React, { useLayoutEffect, useRef } from 'react';
import { LogReportButton } from './LogReportButton';
import { LogSkeleton } from './LogSkeleton';

export const LogPanel = ({ logs = [], loading = false }) => {
  const hasLogs = Array.isArray(logs) && logs.length > 0;
  const logContainerRef = useRef(null);
  const savedScrollTop = useRef(0);
  const previousLoading = useRef(false);

  useLayoutEffect(() => {
    const node = logContainerRef.current;
    if (!node) {
      previousLoading.current = loading;
      return;
    }

    if (loading) {
      savedScrollTop.current = node.scrollTop;
    } else if (previousLoading.current && !loading) {
      node.scrollTop = savedScrollTop.current;
    }

    previousLoading.current = loading;
  }, [loading]);

  const handleSaveScroll = () => {
    const node = logContainerRef.current;
    if (node) {
      savedScrollTop.current = node.scrollTop;
    }
  };

  return (
    <div className="relative flex flex-col h-full min-h-0 overflow-hidden w-full">
      <div
        ref={logContainerRef}
        onScroll={handleSaveScroll}
        className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-2 pb-32 custom-scrollbar"
      >
        {hasLogs ? (
          logs.map((log, index) => (
            <div 
              key={`${log.timestamp}-${index}`} 
              className="p-3 rounded-xl border-l-4 text-[var(--p-box-logs)] text-theme-main shadow-sm transition-all duration-200"
              style={{ backgroundColor: 'var(--p-box-logs)' }}
            >
              <p className="text-[var(--p-text-logs)] text-theme-title uppercase text-[11px] leading-tight">
                <span className="var(--p-timestamp-logs)">{log.timestamp}</span>
                <span className="var(--p-text-logs) mx-1">|</span> 
                {log.message}
              </p>
            </div>
          ))
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <LogSkeleton />
            <span className="mt-4 text-[10px] font-bold font-mono text-muted-theme uppercase tracking-widest animate-pulse">
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-sm font-bold text-[var(--p-text)]">Nenhum log disponível no momento.</span>
            <span className="mt-2 text-[10px] font-mono text-[var(--p-text)] uppercase tracking-widest">
              Verifique se o serviço de logs está ativo e atualize a página.
            </span>
          </div>
        )}
      </div>

      {loading && hasLogs && (
        <div className="absolute top-4 right-4 rounded-full bg-theme-divider/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-theme-title backdrop-blur-sm">
        </div>
      )}

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