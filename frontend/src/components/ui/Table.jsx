import React from 'react';

export function Table({ children, className = "" }) {
  return (
    <table className={`min-w-full border-collapse ${className}`}>
      {children}
    </table>
  );
}

export function TableHeader({ children, className = "" }) {
  return (
    <thead className={`border-b border-theme-divider hover:bg-transparent ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "" }) {
  return (
    <tbody className={`divide-y divide-theme-divider ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "" }) {
  return (
    <tr className={`table-row-theme ${className}`}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "" }) {
  return (
    <th className={`px-6 py-3 text-left text-[11px] font-mono font-medium text-main-theme uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "" }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-xs font-mono text-muted-theme ${className}`}>
      {children}
    </td>
  );
}