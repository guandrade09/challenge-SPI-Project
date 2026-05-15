import React from 'react';

export function Table({ children }) {
  // Filtramos os filhos para garantir que o que for Header vá para o thead 
  // e o que for Body vá para o tbody, sem depender de índices fixos [0] [1]
  return (
    <table className="min-w-full divide-y divide-gray-200">
      {children}
    </table>
  );
}

export function TableHeader({ children }) {
  return (
    <thead className="bg-gray-50">
      {children}
    </thead>
  );
}

export function TableBody({ children }) {
  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {children}
    </tbody>
  );
}

export function TableRow({ children }) {
  return (
    <tr className="hover:bg-zinc-50 transition-colors">
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "" }) {
  return (
    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "" }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${className}`}>
      {children}
    </td>
  );
}