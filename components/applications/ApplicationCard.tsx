import Link from "next/link";
import type { Lang } from "@/lib/i18n/dict";
import { t } from "@/lib/i18n";
import { labelApplicationStatus } from "@/lib/i18n/labels";

export type ApplicationCardKind = "university" | "language-camp";

function badgeVariant(status?: string) {
  switch (status) {
    case "DRAFT":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    case "SUBMITTED":
      return "bg-sky-50 text-sky-800 border-sky-200";
    case "IN_REVIEW":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "MISSING_DOCUMENTS":
      return "bg-rose-50 text-rose-900 border-rose-200";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-900 border-emerald-200";
    case "REJECTED":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

function kindLabel(kind: ApplicationCardKind, lang: Lang) {
  return kind === "university" ? t("university", lang) : t("languageCamp", lang);
}

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

type Props = {
  lang: Lang;
  kind: ApplicationCardKind;
  title: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
  href: string;
};

export function ApplicationCard({ lang, kind, title, status, updatedAt, createdAt, href }: Props) {
  const dateLabel = formatDate(updatedAt ?? createdAt);

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-[1px] hover:border-zinc-300 hover:shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {kindLabel(kind, lang)}
          </div>
          <div className="mt-1 truncate text-base font-semibold tracking-tight text-zinc-900 group-hover:text-zinc-950">
            {title}
          </div>
        </div>
        <span
          className={[
            "shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold",
            badgeVariant(status),
          ].join(" ")}
        >
          {labelApplicationStatus(status, lang)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-4">
        <span className="text-xs text-zinc-500">
          {t("updated", lang)}: {dateLabel}
        </span>
        <span className="text-sm font-medium text-zinc-900 underline-offset-4 group-hover:underline">
          {t("view", lang)} →
        </span>
      </div>
    </Link>
  );
}
