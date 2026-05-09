"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type HtmlEditorMode = "visual" | "html";
export type HtmlEditorSize = "sm" | "md" | "lg";

export interface HtmlEditorProps {
  value: string;
  onChange: (next: string) => void;

  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  containerClassName?: string;

  editorSize?: HtmlEditorSize;
  placeholder?: string;
}

const SIZES: Record<HtmlEditorSize, { wrap: string; body: string }> = {
  sm: { wrap: "rounded-[var(--radius-md)] text-xs", body: "min-h-[120px] px-2.5 py-2" },
  md: { wrap: "rounded-[var(--radius-md)] text-sm", body: "min-h-[160px] px-3 py-2.5" },
  lg: { wrap: "rounded-[var(--radius-lg)] text-sm", body: "min-h-[220px] px-3.5 py-3" },
};

function exec(cmd: string) {
  try {
    document.execCommand(cmd);
  } catch {
    // noop
  }
}

function execWithValue(cmd: string, value?: string) {
  try {
    document.execCommand(cmd, false, value);
  } catch {
    // noop
  }
}

function normalizeHtml(v: string) {
  return (v ?? "").replace(/\u00A0/g, " ");
}

const COMMON_COLORS: { label: string; value: string }[] = [
  { label: "Siyah", value: "#111827" },
  { label: "Gri", value: "#6B7280" },
  { label: "Beyaz", value: "#FFFFFF" },
  { label: "Mavi", value: "#2563EB" },
  { label: "Yeşil", value: "#16A34A" },
  { label: "Sarı", value: "#F59E0B" },
  { label: "Turuncu", value: "#F97316" },
  { label: "Kırmızı", value: "#DC2626" },
  { label: "Mor", value: "#7C3AED" },
];

export function HtmlEditor({
  value,
  onChange,
  label,
  hint,
  error,
  required,
  disabled,
  containerClassName,
  editorSize = "md",
  placeholder,
}: HtmlEditorProps) {
  const id = React.useId();
  const sizeCfg = SIZES[editorSize];

  const [mode, setMode] = React.useState<HtmlEditorMode>("visual");
  const visualRef = React.useRef<HTMLDivElement | null>(null);
  const htmlTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const lastAppliedToVisual = React.useRef<string | null>(null);
  const selectionRef = React.useRef<Range | null>(null);
  const [headingSelectKey, setHeadingSelectKey] = React.useState(0);

  const applyValueToVisual = React.useCallback(
    (next: string) => {
      const el = visualRef.current;
      if (!el) return;
      const normalized = normalizeHtml(next);
      if (lastAppliedToVisual.current === normalized) return;
      el.innerHTML = normalized || "";
      lastAppliedToVisual.current = normalized;
    },
    [visualRef],
  );

  React.useEffect(() => {
    if (mode !== "visual") return;
    applyValueToVisual(value);
  }, [applyValueToVisual, mode, value]);

  const syncFromVisual = React.useCallback(() => {
    const el = visualRef.current;
    if (!el) return;
    const html = normalizeHtml(el.innerHTML);
    lastAppliedToVisual.current = html;
    onChange(html);
  }, [onChange]);

  const saveSelection = React.useCallback(() => {
    const root = visualRef.current;
    if (!root) return;
    const sel = window.getSelection?.();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const anchor = sel.anchorNode;
    if (!anchor) return;
    if (!root.contains(anchor)) return;
    selectionRef.current = range.cloneRange();
  }, []);

  const restoreSelection = React.useCallback(() => {
    const root = visualRef.current;
    const range = selectionRef.current;
    if (!root || !range) return;
    const sel = window.getSelection?.();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  }, []);

  const applyBlockTag = React.useCallback(
    (tag: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6") => {
      const root = visualRef.current;
      if (!root) return;

      // Focus + restore last known selection inside editor.
      root.focus();
      restoreSelection();

      const sel = window.getSelection?.();
      const anchor = sel?.anchorNode ?? null;
      if (!sel || !anchor || !root.contains(anchor)) return;

      let node: Node | null = anchor;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
      let el = node instanceof Element ? node : null;

      const isBlock = (e: Element) => {
        const t = e.tagName.toLowerCase();
        return (
          t === "p" ||
          t === "div" ||
          t === "li" ||
          t === "blockquote" ||
          t === "pre" ||
          t === "h1" ||
          t === "h2" ||
          t === "h3" ||
          t === "h4" ||
          t === "h5" ||
          t === "h6"
        );
      };

      while (el && el !== root && !isBlock(el)) {
        el = el.parentElement;
      }

      if (!el || el === root) {
        // No obvious block found; wrap selection in a new block.
        const wrapper = document.createElement(tag);
        try {
          const range = sel.rangeCount ? sel.getRangeAt(0) : null;
          if (range && !range.collapsed) {
            const frag = range.extractContents();
            wrapper.appendChild(frag);
            range.insertNode(wrapper);
          } else {
            wrapper.appendChild(document.createElement("br"));
            root.appendChild(wrapper);
          }
        } catch {
          // noop
        }
        syncFromVisual();
        return;
      }

      // Don't convert list items to headings; apply to parent block instead.
      if (el.tagName.toLowerCase() === "li") {
        el = el.parentElement ?? el;
      }

      const currentTag = el.tagName.toLowerCase();
      if (currentTag === tag) {
        syncFromVisual();
        return;
      }

      const next = document.createElement(tag);
      // Preserve inline styles/attributes when possible.
      for (const attr of Array.from(el.attributes)) {
        if (attr.name === "contenteditable") continue;
        next.setAttribute(attr.name, attr.value);
      }
      while (el.firstChild) next.appendChild(el.firstChild);
      el.replaceWith(next);

      // Move caret to end of new block.
      const range = document.createRange();
      range.selectNodeContents(next);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      selectionRef.current = range.cloneRange();

      syncFromVisual();
    },
    [restoreSelection, syncFromVisual],
  );

  const switchTo = React.useCallback(
    (nextMode: HtmlEditorMode) => {
      if (disabled) return;
      if (nextMode === mode) return;

      if (mode === "visual") {
        syncFromVisual();
      }

      setMode(nextMode);
      queueMicrotask(() => {
        if (nextMode === "visual") {
          applyValueToVisual(value);
          visualRef.current?.focus();
        } else {
          htmlTextareaRef.current?.focus();
        }
      });
    },
    [applyValueToVisual, disabled, mode, syncFromVisual, value],
  );

  return (
    <div className={cn("flex w-full flex-col gap-1.5", containerClassName)}>
      {label ? (
        <label htmlFor={id} className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
          {required ? <span className="ml-1 text-[var(--danger-500)]">*</span> : null}
        </label>
      ) : null}

      <div
        className={cn(
          "group flex w-full flex-col overflow-hidden bg-[var(--surface-0)] transition-[box-shadow,border-color]",
          "border",
          error
            ? "border-[var(--danger-500)] focus-within:border-[var(--danger-500)] focus-within:shadow-[var(--ring-danger)]"
            : "border-[var(--border-default)] focus-within:border-[var(--accent-600)] focus-within:shadow-[var(--ring-accent)]",
          disabled && "bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed",
          sizeCfg.wrap,
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-2 py-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              key={headingSelectKey}
              disabled={disabled || mode !== "visual"}
              defaultValue=""
              onChange={(e) => {
                const next = (e.target.value || "") as
                  | ""
                  | "p"
                  | "h1"
                  | "h2"
                  | "h3"
                  | "h4"
                  | "h5"
                  | "h6";
                if (!next) return;
                applyBlockTag(next);
                // Reset UI back to placeholder after applying.
                setHeadingSelectKey((k) => k + 1);
              }}
              className={cn(
                "h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-0)] px-2 text-xs text-[var(--text-primary)]",
                "disabled:opacity-50",
              )}
              aria-label="Başlık"
            >
              <option value="" disabled>
                Başlık
              </option>
              <option value="p">Paragraf</option>
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="h4">H4</option>
              <option value="h5">H5</option>
              <option value="h6">H6</option>
            </select>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                {COMMON_COLORS.map((c) => (
                  <button
                    key={`fg-${c.value}`}
                    type="button"
                    disabled={disabled || mode !== "visual"}
                    title={`Metin rengi: ${c.label}`}
                    aria-label={`Metin rengi: ${c.label}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      visualRef.current?.focus();
                      execWithValue("foreColor", c.value);
                      syncFromVisual();
                    }}
                    className="h-6 w-6 rounded-md border border-[var(--border-subtle)] disabled:opacity-50"
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>

              <span className="mx-1 h-5 w-px bg-[var(--border-subtle)]" />

              <div className="flex items-center gap-1">
                {COMMON_COLORS
                  .filter((c) => c.value !== "#FFFFFF")
                  .map((c) => (
                    <button
                      key={`bg-${c.value}`}
                      type="button"
                      disabled={disabled || mode !== "visual"}
                      title={`Vurgu: ${c.label}`}
                      aria-label={`Vurgu: ${c.label}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        visualRef.current?.focus();
                        execWithValue("hiliteColor", c.value);
                        syncFromVisual();
                      }}
                      className="h-6 w-6 rounded-md border border-[var(--border-subtle)] disabled:opacity-50"
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
              </div>
            </div>

            <button
              type="button"
              disabled={disabled || mode !== "visual"}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                visualRef.current?.focus();
                exec("bold");
                syncFromVisual();
              }}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-0)] px-2 py-1 text-xs text-[var(--text-primary)] disabled:opacity-50"
            >
              B
            </button>
            <button
              type="button"
              disabled={disabled || mode !== "visual"}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                visualRef.current?.focus();
                exec("italic");
                syncFromVisual();
              }}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-0)] px-2 py-1 text-xs italic text-[var(--text-primary)] disabled:opacity-50"
            >
              I
            </button>
            <button
              type="button"
              disabled={disabled || mode !== "visual"}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                visualRef.current?.focus();
                exec("underline");
                syncFromVisual();
              }}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-0)] px-2 py-1 text-xs underline text-[var(--text-primary)] disabled:opacity-50"
            >
              U
            </button>

            <span className="mx-1 h-5 w-px bg-[var(--border-subtle)]" />

            <button
              type="button"
              disabled={disabled || mode !== "visual"}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                visualRef.current?.focus();
                exec("justifyLeft");
                syncFromVisual();
              }}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-0)] px-2 py-1 text-xs text-[var(--text-primary)] disabled:opacity-50"
            >
              Sol
            </button>
            <button
              type="button"
              disabled={disabled || mode !== "visual"}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                visualRef.current?.focus();
                exec("justifyCenter");
                syncFromVisual();
              }}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-0)] px-2 py-1 text-xs text-[var(--text-primary)] disabled:opacity-50"
            >
              Orta
            </button>
            <button
              type="button"
              disabled={disabled || mode !== "visual"}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                visualRef.current?.focus();
                exec("justifyRight");
                syncFromVisual();
              }}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-0)] px-2 py-1 text-xs text-[var(--text-primary)] disabled:opacity-50"
            >
              Sağ
            </button>

            <span className="mx-1 h-5 w-px bg-[var(--border-subtle)]" />

            <button
              type="button"
              disabled={disabled || mode !== "visual"}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                visualRef.current?.focus();
                exec("insertUnorderedList");
                syncFromVisual();
              }}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-0)] px-2 py-1 text-xs text-[var(--text-primary)] disabled:opacity-50"
            >
              • Liste
            </button>
            <button
              type="button"
              disabled={disabled || mode !== "visual"}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                visualRef.current?.focus();
                exec("insertOrderedList");
                syncFromVisual();
              }}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-0)] px-2 py-1 text-xs text-[var(--text-primary)] disabled:opacity-50"
            >
              1. Liste
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => switchTo("visual")}
              className={cn(
                "rounded-md border px-2 py-1 text-xs",
                mode === "visual"
                  ? "border-[var(--accent-600)] bg-[var(--surface-0)] text-[var(--text-primary)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-0)] text-[var(--text-secondary)]",
                disabled && "opacity-50",
              )}
            >
              Normal
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => switchTo("html")}
              className={cn(
                "rounded-md border px-2 py-1 text-xs",
                mode === "html"
                  ? "border-[var(--accent-600)] bg-[var(--surface-0)] text-[var(--text-primary)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-0)] text-[var(--text-secondary)]",
                disabled && "opacity-50",
              )}
            >
              HTML
            </button>
          </div>
        </div>

        {mode === "visual" ? (
          <div className="relative">
            {!normalizeHtml(value) && placeholder ? (
              <div
                className={cn(
                  "pointer-events-none absolute left-0 top-0 select-none text-[var(--text-muted)]",
                  sizeCfg.body,
                )}
              >
                {placeholder}
              </div>
            ) : null}
            <div
              id={id}
              ref={visualRef}
              contentEditable={!disabled}
              role="textbox"
              aria-multiline="true"
              suppressContentEditableWarning
                onMouseUp={() => saveSelection()}
                onKeyUp={() => saveSelection()}
                onFocus={() => saveSelection()}
              onInput={() => syncFromVisual()}
              onBlur={() => syncFromVisual()}
              className={cn(
                "w-full outline-none bg-transparent text-[var(--text-primary)]",
                "overflow-auto",
                sizeCfg.body,
                disabled && "cursor-not-allowed",
              )}
            />
          </div>
        ) : (
          <textarea
            ref={htmlTextareaRef}
            id={id}
            disabled={disabled}
            required={required}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "w-full resize-y bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
              "outline-none disabled:cursor-not-allowed font-mono",
              sizeCfg.body,
            )}
          />
        )}
      </div>

      {error ? (
        <p className="text-xs leading-5 text-[var(--danger-600)]">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-5 text-[var(--text-tertiary)]">{hint}</p>
      ) : null}
    </div>
  );
}

