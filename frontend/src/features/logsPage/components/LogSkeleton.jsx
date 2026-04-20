const LogSkeleton = () => (
  <div className="flex flex-col gap-4 w-full">
    {/* Bloco 1 - Opacidade Alta */}
    <div className="bg-white/60 p-4 rounded-xl border-l-4 border-panel-header/30 animate-pulse">
      <div className="h-3 w-3/4 bg-zinc-200 rounded"></div>
    </div>
    
    {/* Bloco 2 - Opacidade Média (com delay) */}
    <div className="bg-white/40 p-4 rounded-xl border-l-4 border-panel-header/20 animate-pulse [animation-delay:200ms]">
      <div className="h-3 w-1/2 bg-zinc-200 rounded"></div>
    </div>
    
    {/* Bloco 3 - Opacidade Baixa (com delay maior) */}
    <div className="bg-white/20 p-4 rounded-xl border-l-4 border-panel-header/10 animate-pulse [animation-delay:400ms]">
      <div className="h-3 w-5/6 bg-zinc-200 rounded"></div>
    </div>
  </div>
);

export default LogSkeleton;