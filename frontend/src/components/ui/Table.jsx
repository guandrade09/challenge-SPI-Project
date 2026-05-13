import React from 'react';

export function Table({ children }) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        {children[0]}
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {children[1]}
      </tbody>
    </table>
  );
}

export function TableHeader({ children }) {
  return (
    <tr>
      {children}
    </tr>
  );
}

export function TableRow({ children }) {
  return (
    <tr>
      {children}
    </tr>
  );
}

export function TableHead({ children }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      {children}
    </th>
  );
}

export function TableBody({ children }) {
  return (
    <>{children}</>
  );
}

export function TableCell({ children, className }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${className}`}>
      {children}
    </td>
  );
}