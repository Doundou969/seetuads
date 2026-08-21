"use client";

import { ReactNode } from "react";

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, unknown>[];
  actions?: (row: Record<string, unknown>) => ReactNode;
}

export function DataTable({ columns, rows, actions }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-4">
                {col.label}
              </th>
            ))}
            {actions && <th className="px-6 py-4 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-6 py-8 text-center text-gray-500"
              >
                Aucune donnee
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition">
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-gray-900">
                  {col.render
                    ? col.render(row[col.key], row)
                    : (row[col.key] as ReactNode) || "—"}
                </td>
              ))}
              {actions && <td className="px-6 py-4 text-right">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
