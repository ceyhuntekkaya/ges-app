"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import { Input } from "./Input";
import { Checkbox } from "./Checkbox";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { Skeleton } from "./Skeleton";

export type SortDirection = "asc" | "desc";

export interface TableSortState {
  key: string;
  direction: SortDirection;
}

export interface TableColumn<TRow> {
  /** Stable identifier for sort state, etc. */
  key: string;
  /** Header label. */
  header: React.ReactNode;
  /** Cell renderer. */
  cell: (row: TRow, idx: number) => React.ReactNode;
  /** Accessor for default sorting (when sortable, no custom onSort). */
  sortAccessor?: (row: TRow) => string | number | null | undefined;
  sortable?: boolean;
  width?: number | string;
  align?: "left" | "center" | "right";
  /** Truncate long text with ellipsis. */
  truncate?: boolean;
  /** Hide column on small screens. */
  hideOnMobile?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface TableProps<TRow> {
  columns: TableColumn<TRow>[];
  data: TRow[];
  /** Stable row id getter. */
  rowKey: (row: TRow, idx: number) => string;

  loading?: boolean;
  /** Default 5 skeleton rows when loading and data is empty. */
  loadingRowCount?: number;

  /** Search bar in toolbar (toggleable). */
  searchable?: boolean;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  /** Custom toolbar actions, rendered to the right of the search input. */
  toolbarActions?: React.ReactNode;
  /** Title above the table; renders the toolbar if any of search/title/actions exist. */
  title?: React.ReactNode;

  /** Sort state — controlled. When omitted, sorting is uncontrolled in-memory. */
  sortable?: boolean;
  sort?: TableSortState | null;
  onSortChange?: (next: TableSortState | null) => void;

  /** Row selection. */
  selectable?: boolean;
  selectedIds?: string[];
  onSelectChange?: (ids: string[]) => void;

  /** Pagination — controlled. */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
    hideSizeSelector?: boolean;
  };

  /** Density. */
  density?: "comfortable" | "compact";
  /** Sticky header inside scroll container. */
  stickyHeader?: boolean;

  /** Empty state */
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;

  /** Row click handler (bypassed by interactive cells like buttons). */
  onRowClick?: (row: TRow, idx: number) => void;
  /** Render an extra "actions" cell at the end of each row. */
  rowActions?: (row: TRow, idx: number) => React.ReactNode;

  /** Container className. */
  className?: string;
}

const ALIGN: Record<NonNullable<TableColumn<unknown>["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function seededPct(seed: number, min = 40, max = 90) {
  // Deterministic pseudo-random in [0, 1)
  const x = Math.sin(seed * 999) * 10000;
  const f = x - Math.floor(x);
  return min + f * (max - min);
}

function columnSeed(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function Table<TRow>({
  columns,
  data,
  rowKey,
  loading,
  loadingRowCount = 5,

  searchable = false,
  searchValue,
  searchPlaceholder = "Ara...",
  onSearchChange,
  toolbarActions,
  title,

  sortable = false,
  sort,
  onSortChange,

  selectable = false,
  selectedIds,
  onSelectChange,

  pagination,
  density = "comfortable",
  stickyHeader = false,

  emptyTitle = "Kayıt bulunamadı",
  emptyDescription = "Filtreleri değiştirmeyi veya yeni bir kayıt eklemeyi deneyin.",
  emptyIcon,
  emptyAction,

  onRowClick,
  rowActions,

  className,
}: TableProps<TRow>) {
  // Uncontrolled sort fallback.
  const [internalSort, setInternalSort] = React.useState<TableSortState | null>(null);
  const effectiveSort = sort !== undefined ? sort : internalSort;

  const setEffectiveSort = (next: TableSortState | null) => {
    if (onSortChange) onSortChange(next);
    else setInternalSort(next);
  };

  const handleSort = (col: TableColumn<TRow>) => {
    if (!sortable || !col.sortable) return;
    if (!effectiveSort || effectiveSort.key !== col.key) {
      setEffectiveSort({ key: col.key, direction: "asc" });
    } else if (effectiveSort.direction === "asc") {
      setEffectiveSort({ key: col.key, direction: "desc" });
    } else {
      setEffectiveSort(null);
    }
  };

  // In-memory sort only when sort is not controlled and accessor is given.
  const sortedData = React.useMemo(() => {
    if (!sortable || !effectiveSort) return data;
    if (sort !== undefined) return data; // controlled
    const col = columns.find((c) => c.key === effectiveSort.key);
    if (!col?.sortAccessor) return data;
    const dir = effectiveSort.direction === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = col.sortAccessor!(a);
      const bv = col.sortAccessor!(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [columns, data, effectiveSort, sortable, sort]);

  const allRowIds = React.useMemo(
    () => sortedData.map((row, idx) => rowKey(row, idx)),
    [sortedData, rowKey],
  );

  const selectedSet = React.useMemo(() => new Set(selectedIds ?? []), [selectedIds]);
  const allSelected =
    selectable && allRowIds.length > 0 && allRowIds.every((id) => selectedSet.has(id));
  const someSelected = selectable && allRowIds.some((id) => selectedSet.has(id));

  const toggleAll = () => {
    if (!onSelectChange) return;
    if (allSelected) {
      onSelectChange((selectedIds ?? []).filter((id) => !allRowIds.includes(id)));
    } else {
      const merged = new Set(selectedIds ?? []);
      allRowIds.forEach((id) => merged.add(id));
      onSelectChange([...merged]);
    }
  };

  const toggleOne = (id: string) => {
    if (!onSelectChange) return;
    const next = new Set(selectedIds ?? []);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectChange([...next]);
  };

  const showToolbar = !!title || searchable || !!toolbarActions;

  const cellPad =
    density === "compact" ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm";
  const headPad =
    density === "compact"
      ? "px-3 py-2 text-[11px]"
      : "px-4 py-2.5 text-[11px]";

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-xs)]",
        className,
      )}
    >
      {showToolbar ? (
        <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {title ? (
              <div className="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">
                {title}
              </div>
            ) : null}
            {searchable ? (
              <div className="w-full max-w-xs">
                <Input
                  inputSize="sm"
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder={searchPlaceholder}
                  leftIcon={<Icon name="search" size={14} />}
                  clearable
                  onClear={() => onSearchChange?.("")}
                />
              </div>
            ) : null}
          </div>
          {toolbarActions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{toolbarActions}</div>
          ) : null}
        </div>
      ) : null}

      <div className="relative flex-1 overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            {selectable ? <col style={{ width: 44 }} /> : null}
            {columns.map((col) => (
              <col
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
              />
            ))}
            {rowActions ? <col style={{ width: 80 }} /> : null}
          </colgroup>
          <thead
            className={cn(
              "border-b border-[var(--border-default)] bg-[var(--surface-1)]",
              stickyHeader && "sticky top-0 z-10",
            )}
          >
            <tr>
              {selectable ? (
                <th className={cn("text-left font-medium", headPad)}>
                  <Checkbox
                    aria-label="Tümünü seç"
                    checked={allSelected}
                    indeterminate={!allSelected && someSelected}
                    onChange={toggleAll}
                  />
                </th>
              ) : null}
              {columns.map((col) => {
                const isActive = effectiveSort?.key === col.key;
                const dir = isActive ? effectiveSort?.direction : null;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      "font-medium uppercase tracking-wider text-[var(--text-tertiary)]",
                      headPad,
                      ALIGN[col.align ?? "left"],
                      col.hideOnMobile && "hidden sm:table-cell",
                      col.headerClassName,
                    )}
                  >
                    {sortable && col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 -mx-1 transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]",
                          isActive && "text-[var(--text-secondary)]",
                        )}
                      >
                        <span>{col.header}</span>
                        <Icon
                          name={
                            !isActive
                              ? "arrow-up-down"
                              : dir === "asc"
                              ? "arrow-up"
                              : "arrow-down"
                          }
                          size={12}
                          className={cn(
                            !isActive ? "opacity-50" : "opacity-90",
                          )}
                        />
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                );
              })}
              {rowActions ? (
                <th
                  className={cn(
                    "font-medium uppercase tracking-wider text-[var(--text-tertiary)] text-right",
                    headPad,
                  )}
                >
                  <span className="sr-only">İşlemler</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {loading && sortedData.length === 0
              ? Array.from({ length: loadingRowCount }).map((_, ridx) => (
                  <tr
                    key={`sk-${ridx}`}
                    className="border-b border-[var(--border-subtle)] last:border-b-0"
                  >
                    {selectable ? (
                      <td className={cellPad}>
                        <Skeleton width={16} height={16} />
                      </td>
                    ) : null}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(cellPad, col.hideOnMobile && "hidden sm:table-cell")}
                      >
                        <Skeleton
                          height="12px"
                          width={`${seededPct((ridx + 1) * 1000 + (columnSeed(col.key) % 997)).toFixed(2)}%`}
                          shape="text"
                        />
                      </td>
                    ))}
                    {rowActions ? (
                      <td className={cellPad}>
                        <div className="flex justify-end">
                          <Skeleton width={48} height={20} />
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              : sortedData.map((row, idx) => {
                  const id = rowKey(row, idx);
                  const selected = selectedSet.has(id);
                  return (
                    <tr
                      key={id}
                      data-row-id={id}
                      onClick={
                        onRowClick
                          ? (e) => {
                              const target = e.target as HTMLElement;
                              // Skip when clicking on interactive controls.
                              if (
                                target.closest(
                                  "button,a,input,select,textarea,[role='button'],[data-no-row-click]",
                                )
                              )
                                return;
                              onRowClick(row, idx);
                            }
                          : undefined
                      }
                      className={cn(
                        "border-b border-[var(--border-subtle)] transition-colors last:border-b-0",
                        onRowClick && "cursor-pointer",
                        selected
                          ? "bg-[var(--accent-50)]/50 hover:bg-[var(--accent-50)]"
                          : "hover:bg-[var(--surface-1)]",
                      )}
                    >
                      {selectable ? (
                        <td className={cellPad} data-no-row-click>
                          <Checkbox
                            aria-label="Satırı seç"
                            checked={selected}
                            onChange={() => toggleOne(id)}
                          />
                        </td>
                      ) : null}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "text-[var(--text-secondary)]",
                            cellPad,
                            ALIGN[col.align ?? "left"],
                            col.truncate && "truncate",
                            col.hideOnMobile && "hidden sm:table-cell",
                            col.className,
                          )}
                        >
                          {col.cell(row, idx)}
                        </td>
                      ))}
                      {rowActions ? (
                        <td className={cn(cellPad, "text-right")} data-no-row-click>
                          <div className="flex justify-end">{rowActions(row, idx)}</div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
          </tbody>
        </table>
        {!loading && sortedData.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        ) : null}
      </div>

      {pagination ? (
        <div className="border-t border-[var(--border-subtle)]">
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            pageSizeOptions={pagination.pageSizeOptions}
            hideSizeSelector={pagination.hideSizeSelector}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
          />
        </div>
      ) : null}
    </div>
  );
}
