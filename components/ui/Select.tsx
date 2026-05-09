"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export type SelectOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type SelectSize = "sm" | "md" | "lg";

export interface SelectProps<TValue extends string = string> {
  options: SelectOption<TValue>[];
  value?: TValue | null;
  onChange?: (value: TValue | null) => void;
  /** Show a search input inside the dropdown. Toggleable via prop. */
  searchable?: boolean;
  /** Allow clearing the selected value. */
  clearable?: boolean;
  placeholder?: string;
  /** Async loader. Called every time the search query changes (debounced 250ms). */
  onSearch?: (query: string) => void;
  loading?: boolean;
  disabled?: boolean;
  size?: SelectSize;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  id?: string;
  name?: string;
  className?: string;
  containerClassName?: string;
  /** Maximum dropdown height. */
  maxHeight?: number;
  /** Notice text shown when there are no results. */
  emptyText?: string;
  /** Render a custom item. */
  renderOption?: (option: SelectOption<TValue>, isSelected: boolean) => React.ReactNode;
}

const SIZES: Record<SelectSize, string> = {
  sm: "h-8 rounded-[var(--radius-md)] text-xs px-2.5",
  md: "h-9 rounded-[var(--radius-md)] text-sm px-3",
  lg: "h-11 rounded-[var(--radius-lg)] text-sm px-3.5",
};

export function Select<TValue extends string = string>({
  options,
  value,
  onChange,
  searchable = false,
  clearable = false,
  placeholder = "Seçiniz...",
  onSearch,
  loading = false,
  disabled = false,
  size = "md",
  label,
  hint,
  error,
  required,
  id,
  name,
  className,
  containerClassName,
  maxHeight = 280,
  emptyText = "Sonuç bulunamadı.",
  renderOption,
}: SelectProps<TValue>) {
  const generatedId = React.useId();
  const triggerId = id || generatedId;
  const listboxId = `${triggerId}-listbox`;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(0);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const optionRefs = React.useRef<Array<HTMLLIElement | null>>([]);

  const selected = React.useMemo(
    () => (value ? options.find((o) => o.value === value) ?? null : null),
    [options, value],
  );

  // Filtering: if onSearch is provided, options are presumed externally filtered.
  const filteredOptions = React.useMemo(() => {
    if (onSearch || !searchable || !query) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, query, searchable, onSearch]);

  // Outside click & escape close.
  React.useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        triggerRef.current?.contains(t) ||
        popoverRef.current?.contains(t)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Focus management when opening.
  React.useEffect(() => {
    if (!open) return;
    if (searchable) {
      const t = setTimeout(() => searchRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open, searchable]);

  // Reset active index when filter results change.
  React.useEffect(() => {
    setActiveIdx(0);
  }, [query, options.length]);

  // External search debounce.
  React.useEffect(() => {
    if (!onSearch) return;
    const t = setTimeout(() => onSearch(query), 250);
    return () => clearTimeout(t);
  }, [query, onSearch]);

  // Scroll active option into view.
  React.useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIdx]?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  const commit = (opt: SelectOption<TValue>) => {
    if (opt.disabled) return;
    onChange?.(opt.value);
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  };

  const handleTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filteredOptions[activeIdx];
      if (opt) commit(opt);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className={cn("flex w-full flex-col gap-1.5", containerClassName)}>
      {label ? (
        <label htmlFor={triggerId} className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
          {required ? <span className="ml-1 text-[var(--danger-500)]">*</span> : null}
        </label>
      ) : null}

      <div className={cn("relative", className)}>
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          name={name}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          onClick={() => !disabled && setOpen((v) => !v)}
          onKeyDown={handleTriggerKey}
          className={cn(
            "group flex w-full items-center gap-2 border bg-[var(--surface-0)] text-left transition-[box-shadow,border-color]",
            error
              ? "border-[var(--danger-500)] focus-visible:border-[var(--danger-500)] focus-visible:shadow-[var(--ring-danger)]"
              : "border-[var(--border-default)] focus-visible:border-[var(--accent-600)] focus-visible:shadow-[var(--ring-accent)]",
            disabled && "bg-[var(--surface-2)] cursor-not-allowed text-[var(--text-muted)]",
            "outline-none",
            SIZES[size],
          )}
        >
          <span
            className={cn(
              "flex-1 truncate",
              selected ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]",
            )}
          >
            {selected ? selected.label : placeholder}
          </span>

          {clearable && selected && !disabled ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Temizle"
              onMouseDown={(e) => {
                // Prevent trigger button focus/click toggling.
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange?.(null);
              }}
              className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]"
            >
              <Icon name="x" size={12} />
            </span>
          ) : null}

          <Icon
            name="chevron-down"
            size={16}
            className={cn(
              "text-[var(--text-tertiary)] transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open ? (
          <div
            ref={popoverRef}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-md)]"
            style={{ animation: "ges-scale-in 120ms ease-out" }}
            onKeyDown={handleListKey}
          >
            {searchable ? (
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
                <Icon name="search" size={14} className="text-[var(--text-tertiary)]" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ara..."
                  className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                />
              </div>
            ) : null}

            <ul
              role="listbox"
              id={listboxId}
              tabIndex={-1}
              className="overflow-y-auto p-1"
              style={{ maxHeight }}
            >
              {loading ? (
                <li className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-tertiary)]">
                  <Icon name="loader" size={14} />
                  Yükleniyor...
                </li>
              ) : filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-[var(--text-tertiary)]">{emptyText}</li>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = selected?.value === opt.value;
                  const isActive = idx === activeIdx;
                  return (
                    <li
                      key={opt.value}
                      ref={(el) => {
                        optionRefs.current[idx] = el;
                      }}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled || undefined}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => commit(opt)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-sm",
                        isActive && !opt.disabled
                          ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)]",
                        opt.disabled && "cursor-not-allowed opacity-50",
                      )}
                    >
                      {renderOption ? (
                        renderOption(opt, isSelected)
                      ) : (
                        <>
                          <span className="flex flex-col min-w-0">
                            <span className="truncate font-medium text-[var(--text-primary)]">
                              {opt.label}
                            </span>
                            {opt.description ? (
                              <span className="truncate text-xs text-[var(--text-tertiary)]">
                                {opt.description}
                              </span>
                            ) : null}
                          </span>
                          {isSelected ? (
                            <Icon
                              name="check"
                              size={14}
                              className="shrink-0 text-[var(--accent-600)]"
                              strokeWidth={2.4}
                            />
                          ) : null}
                        </>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs leading-5 text-[var(--danger-600)]">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-5 text-[var(--text-tertiary)]">{hint}</p>
      ) : null}
    </div>
  );
}
