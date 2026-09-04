import React from 'react';

export function AnalisePageSkeleton() {
  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-8 flex flex-col font-sans animate-pulse">
      {/* HEADER SKELETON */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-800 rounded-md"></div>
          <div className="h-8 w-80 bg-slate-800 rounded-lg"></div>
          <div className="h-4 w-96 bg-slate-800/60 rounded-md"></div>
        </div>
        <div className="flex gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <div className="h-9 w-32 bg-slate-800 rounded-lg"></div>
          <div className="h-9 w-32 bg-slate-800/50 rounded-lg"></div>
          <div className="h-9 w-32 bg-slate-800/50 rounded-lg"></div>
        </div>
      </div>

      {/* CARDS SKELETON */}
      <div className="flex flex-col gap-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col gap-5">
            {/* Header do Card */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="h-6 w-64 bg-slate-800 rounded-md"></div>
              <div className="h-5 w-28 bg-slate-800/60 rounded-md"></div>
            </div>

            {/* Grid Gráfico + Painel Informativo */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 h-72 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-center">
                <div className="w-11/12 h-4/5 bg-slate-800/40 rounded-md"></div>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="h-20 bg-slate-950/60 rounded-xl border border-slate-800/80 p-3.5 space-y-2">
                  <div className="h-4 w-28 bg-slate-800 rounded"></div>
                  <div className="h-3 w-full bg-slate-800/50 rounded"></div>
                  <div className="h-3 w-4/5 bg-slate-800/50 rounded"></div>
                </div>
                <div className="h-20 bg-slate-950/60 rounded-xl border border-slate-800/80 p-3.5 space-y-2">
                  <div className="h-4 w-28 bg-slate-800 rounded"></div>
                  <div className="h-3 w-full bg-slate-800/50 rounded"></div>
                  <div className="h-3 w-3/4 bg-slate-800/50 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnalisePageSkeleton;