"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import { Select } from "./Select";

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  /** Total item count. */
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Allow user to change page size. */
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Show "Showing X-Y of N" summary. */
  showSummary?: boolean;
  className?: string;
  /** Hide the size selector entirely. */
  hideSizeSelector?: boolean;
}

function buildPages(current: number, totalPages: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showSummary = true,
  hideSizeSelector = false,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(total, safePage * pageSize);

  const pages = React.useMemo(() => buildPages(safePage, totalPages), [safePage, totalPages]);

  const goto = (p: number) => {
    if (p === safePage || p < 1 || p > totalPages) return;
    onPageChange(p);
  };

  const sizeOptions = pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }));

  return (
    <div
      className={cn(
        "flex flex-col items-stretch gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
        {showSummary ? (
          <span className="tabular-nums">
            <span className="font-medium text-[var(--text-secondary)]">{start}</span>–
            <span className="font-medium text-[var(--text-secondary)]">{end}</span> /{" "}
            <span className="font-medium text-[var(--text-secondary)]">{total}</span>
          </span>
        ) : null}
        {!hideSizeSelector && onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <span>Sayfa boyutu</span>
            <div className="w-20">
              <Select
                size="sm"
                options={sizeOptions}
                value={String(pageSize)}
                onChange={(v) => v && onPageSizeChange(Number(v))}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Önceki sayfa"
          disabled={safePage === 1}
          onClick={() => goto(safePage - 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="chevron-left" size={14} />
        </button>

        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`gap-${idx}`}
              className="inline-flex h-8 w-8 items-center justify-center text-xs text-[var(--text-muted)]"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === safePage ? "page" : undefined}
              onClick={() => goto(p)}
              className={cn(
                "inline-flex h-8 min-w-8 items-center justify-center rounded-[var(--radius-md)] px-2 text-xs font-medium tabular-nums transition-colors",
                p === safePage
                  ? "bg-[var(--text-primary)] text-white"
                  : "border border-[var(--border-default)] bg-[var(--surface-0)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
              )}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Sonraki sayfa"
          disabled={safePage === totalPages}
          onClick={() => goto(safePage + 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="chevron-right" size={14} />
        </button>
      </div>
    </div>
  );
}
