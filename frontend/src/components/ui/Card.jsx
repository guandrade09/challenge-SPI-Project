import React from 'react';

export function Card({ children }) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {children}
    </div>
  );
}

export function CardHeader({ children }) {
  return (
    <div className="p-4 border-b">
      {children}
    </div>
  );
}

export function CardContent({ children }) {
  return (
    <div className="p-4">
      {children}
    </div>
  );
}

export function CardTitle({ children }) {
  return (
    <h3 className="text-lg font-semibold">
      {children}
    </h3>
  );
}

export function CardDescription({ children }) {
  return (
    <p className="text-sm text-gray-600">
      {children}
    </p>
  );
}