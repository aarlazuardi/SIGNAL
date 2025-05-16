// Basic Table UI components for compatibility after migration from TypeScript to JavaScript
import * as React from "react";

export function Table({ children, ...props }) {
  return (
    <table {...props} className="w-full border-collapse">
      {children}
    </table>
  );
}

export function TableHeader({ children, ...props }) {
  return <thead {...props}>{children}</thead>;
}

export function TableBody({ children, ...props }) {
  return <tbody {...props}>{children}</tbody>;
}

export function TableRow({ children, ...props }) {
  return <tr {...props}>{children}</tr>;
}

export function TableHead({ children, ...props }) {
  return (
    <th {...props} className="px-4 py-2 text-left font-semibold">
      {children}
    </th>
  );
}

export function TableCell({ children, ...props }) {
  return (
    <td {...props} className="px-4 py-2">
      {children}
    </td>
  );
}
