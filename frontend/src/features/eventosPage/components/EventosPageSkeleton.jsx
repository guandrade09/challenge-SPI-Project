import React from 'react';

export function EventosPageSkeleton() {
  return (
    <div className="w-full flex flex-col gap-6 p-4 sm:p-6 min-h-screen bg-[var(--p-bg)] animate-pulse">
      <header className="flex flex-col gap-2 border-b border-[var(--p-border)] pb-4">
        <div className="h-7 w-64 bg-[var(--p-header-bg)] rounded-md" />
        <div className="h-4 w-96 max-w-full bg-[var(--p-header-bg)] rounded-md opacity-60" />
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="panel-subcard flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <div className="h-3 w-28 bg-[var(--p-border)] rounded" />
              <div className="h-7 w-12 bg-[var(--p-border)] rounded-md" />
            </div>
            <div className="w-11 h-11 rounded-lg bg-[var(--p-border)]" />
          </div>
        ))}
      </section>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <section className="lg:col-span-2 flex flex-col panel-base overflow-hidden">
          <div className="panel-header-base">
            <div className="h-4 w-40 bg-[var(--p-border)] rounded" />
            <div className="h-3 w-24 bg-[var(--p-border)] rounded" />
          </div>
          <div className="p-4 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-12 w-full bg-[var(--p-header-bg)] rounded-lg border border-[var(--p-border)]" />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="p-4 rounded-2xl border border-[var(--p-border)] bg-[var(--p-header-bg)] flex flex-col gap-3">
            <div className="h-4 w-36 bg-[var(--p-border)] rounded" />
            <div className="h-32 w-full bg-[var(--p-border)] rounded-lg" />
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="h-9 bg-[var(--p-border)] rounded-lg" />
              <div className="h-9 bg-[var(--p-border)] rounded-lg" />
            </div>
          </div>
          <div className="flex-1 p-4 rounded-2xl border border-[var(--p-border)] bg-[var(--p-header-bg)]" />
        </section>
      </main>
    </div>
  );
}

export default EventosPageSkeleton;