import * as React from "react";
import type { Lang } from "@/lib/i18n/dict";
import { t } from "@/lib/i18n/dict";

export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4">
      <h3 className="text-sm font-semibold tracking-tight text-zinc-900">{title}</h3>
      {children}
    </section>
  );
}

export function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <dl className="grid gap-1">
      <dt className="text-xs font-semibold text-zinc-500">{label}</dt>
      <dd className="text-sm text-zinc-900">{value ?? "-"}</dd>
    </dl>
  );
}

export function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function DetailList({ items, emptyLabel }: { items?: string[]; emptyLabel: string }) {
  if (!items?.length) {
    return <p className="text-sm text-zinc-500">{emptyLabel}</p>;
  }
  return (
    <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-900">
      {items.map((item, i) => (
        <li key={`${i}-${item}`}>{item}</li>
      ))}
    </ol>
  );
}

export function DetailTable({
  lang,
  columns,
  rows,
}: {
  lang: Lang;
  columns: string[];
  rows: React.ReactNode[][];
}) {
  if (!rows.length) {
    return <p className="text-sm text-zinc-500">{t("noItems", lang)}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-zinc-600">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {rows.map((cells, ri) => (
            <tr key={ri}>
              {cells.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-zinc-900">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
