import React from 'react';

export function Progress({ value = 0, className = "" }) {
  return (
    <div className={`relative w-full h-1.5 progress-track-theme ${className}`}>
      <div
        className="absolute top-0 left-0 h-full progress-fill-theme"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

export default Progress;