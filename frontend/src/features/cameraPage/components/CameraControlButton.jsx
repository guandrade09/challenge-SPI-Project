import React from 'react';

export function CameraControlButton({ icon, label, onClick, pressed, disabled = false }) {
  const Icon = icon;
  return <button type="button" onClick={onClick} title={label} aria-label={label} aria-pressed={pressed} disabled={disabled}
    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-black/75 shadow-lg backdrop-blur-md transition-colors hover:border-emerald-400/60 hover:bg-emerald-500/20 hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-40 ${pressed ? 'border-emerald-400/60 text-emerald-300' : 'border-white/20 text-slate-200'}`}>
    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
  </button>;
}
