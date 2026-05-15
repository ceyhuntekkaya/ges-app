"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { LanguageCampApplicationDetailDto, UniversityApplicationDetailDto } from "@/lib/api/generated/index";
import { LanguageCampApplicationDetailView } from "@/components/applications/LanguageCampApplicationDetailView";
import { UniversityApplicationDetailView } from "@/components/applications/UniversityApplicationDetailView";
import { Badge, Tabs } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui/Badge";
import type { Lang } from "@/lib/i18n/dict";
import { t, tf } from "@/lib/i18n/dict";
import { labelApplicationStatus } from "@/lib/i18n/labels";

export type MyApplicationTab = {
  key: string;
  kind: "university" | "language-camp";
  id: string;
  title: string;
  status?: string;
  university?: UniversityApplicationDetailDto;
  languageCamp?: LanguageCampApplicationDetailDto;
  loadError?: number;
};

function statusBadgeVariant(status?: string): BadgeVariant {
  switch (status) {
    case "SUBMITTED":
      return "info";
    case "IN_REVIEW":
      return "warning";
    case "MISSING_DOCUMENTS":
      return "danger";
    case "COMPLETED":
      return "success";
    default:
      return "neutral";
  }
}

function tabKindPrefix(kind: MyApplicationTab["kind"], lang: Lang) {
  return kind === "university" ? t("university", lang) : t("languageCamp", lang);
}

export function MyApplicationsClient({
  lang,
  tabs: initialTabs,
}: {
  lang: Lang;
  tabs: MyApplicationTab[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramTab = searchParams.get("tab");
  const firstKey = initialTabs[0]?.key ?? "";
  const activeKey = initialTabs.some((tab) => tab.key === paramTab) ? (paramTab as string) : firstKey;
  const active = initialTabs.find((tab) => tab.key === activeKey) ?? initialTabs[0];

  React.useEffect(() => {
    if (!firstKey) return;
    if (!paramTab || !initialTabs.some((tab) => tab.key === paramTab)) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("tab", firstKey);
      router.replace(`/applications?${next.toString()}`, { scroll: false });
    }
  }, [firstKey, paramTab, initialTabs, router, searchParams]);

  const tabItems = React.useMemo(
    () =>
      initialTabs.map((tab) => ({
        value: tab.key,
        label: (
          <span className="flex flex-col items-start gap-0.5 text-left sm:flex-row sm:items-center sm:gap-2">
            <span className="truncate">
              {tabKindPrefix(tab.kind, lang)} · {tab.title}
            </span>
          </span>
        ),
        badge: tab.status ? (
          <Badge size="sm" variant={statusBadgeVariant(tab.status)}>
            {labelApplicationStatus(tab.status, lang)}
          </Badge>
        ) : undefined,
      })),
    [initialTabs, lang],
  );

  if (!active) return null;

  const editHref =
    active.kind === "university"
      ? `/applications/university/${active.id}/edit`
      : `/applications/language-camp/${active.id}/edit`;

  return (
    <div className="grid gap-4">
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <Tabs
          items={tabItems}
          value={activeKey}
          onChange={(key) => {
            const next = new URLSearchParams(searchParams.toString());
            next.set("tab", key);
            router.push(`/applications?${next.toString()}`, { scroll: false });
          }}
          variant="underline"
          className="min-w-max"
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {tabKindPrefix(active.kind, lang)}
            </div>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">{active.title}</h2>
            {active.status ? (
              <div className="mt-2">
                <Badge variant={statusBadgeVariant(active.status)}>
                  {labelApplicationStatus(active.status, lang)}
                </Badge>
              </div>
            ) : null}
          </div>
          {active.status === "DRAFT" ? (
            <Link
              href={editHref}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
            >
              {t("editApplication", lang)}
            </Link>
          ) : null}
        </div>

        {active.loadError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
            {tf("failedToLoadHttp", lang, { status: active.loadError })}
          </div>
        ) : active.kind === "university" && active.university ? (
          <UniversityApplicationDetailView data={active.university} lang={lang} />
        ) : active.kind === "language-camp" && active.languageCamp ? (
          <LanguageCampApplicationDetailView data={active.languageCamp} lang={lang} />
        ) : (
          <p className="text-sm text-zinc-500">{t("loading", lang)}</p>
        )}
      </div>
    </div>
  );
}
