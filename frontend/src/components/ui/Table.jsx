import React from 'react';

export function Table({ children, className = "", ...props }) {
  return (
    <table className={`min-w-full border-collapse ${className}`} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({ children, className = "", ...props }) {
  return (
    <thead className={`border-b border-theme-divider hover:bg-transparent ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "", ...props }) {
  return (
    <tbody className={`divide-y divide-theme-divider ${className}`} {...props}>
      {children}
    </tbody>
  );
}

// CORREÇÃO AQUI: Adicionado onClick e ...props no <tr>
export function TableRow({ children, className = "", onClick, ...props }) {
  return (
    <tr onClick={onClick} className={`table-row-theme ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "", ...props }) {
  return (
    <th className={`px-6 py-3 text-left text-[11px] font-mono font-medium text-main-theme uppercase tracking-wider ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "", ...props }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-xs font-mono text-muted-theme ${className}`} {...props}>
      {children}
    </td>
  );
}