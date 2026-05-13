import React from 'react';

export function Progress({ value }) {
  return (
    <div className="relative w-full h-2 bg-gray-200 rounded">
      <div
        className="absolute top-0 left-0 h-full bg-blue-600 rounded"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}