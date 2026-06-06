"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { UniversityApplicationDetailDto } from "@/lib/api/generated/index";
import type { LanguageCampApplicationGroupDto } from "@/lib/api/portalServer";
import { LanguageCampProjectGroupView } from "@/components/applications/LanguageCampProjectGroupView";
import { UniversityApplicationDetailView } from "@/components/applications/UniversityApplicationDetailView";
import { Badge, Tabs } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui/Badge";
import type { Lang } from "@/lib/i18n/dict";
import { t, tf } from "@/lib/i18n/dict";
import { labelApplicationStatus } from "@/lib/i18n/labels";

export type UniversityApplicationTab = {
  key: string;
  kind: "university";
  id: string;
  title: string;
  status?: string;
  university?: UniversityApplicationDetailDto;
  loadError?: number;
};

export type LanguageCampGroupTab = {
  key: string;
  kind: "language-camp-group";
  projectId: string;
  title: string;
  group?: LanguageCampApplicationGroupDto;
  loadError?: number;
};

export type MyApplicationTab = UniversityApplicationTab | LanguageCampGroupTab;

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

function tabKindPrefix(tab: MyApplicationTab, lang: Lang) {
  return tab.kind === "university" ? t("university", lang) : t("languageCamp", lang);
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
          <span className="truncate">
            {tabKindPrefix(tab, lang)} · {tab.title}
          </span>
        ),
        badge:
          tab.kind === "university" && tab.status ? (
            <Badge size="sm" variant={statusBadgeVariant(tab.status)}>
              {labelApplicationStatus(tab.status, lang)}
            </Badge>
          ) : tab.kind === "language-camp-group" ? (
            <Badge size="sm" variant="neutral">
              {(tab.group?.participants?.length ?? 0) + (lang === "tr" ? " kişi" : "")}
            </Badge>
          ) : undefined,
      })),
    [initialTabs, lang],
  );

  if (!active) return null;

  return (
    <div className="grid gap-4">
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <Tabs
          items={tabItems}
          value={activeKey}
          onChange={(key) => {
            const next = new URLSearchParams(searchParams.toString());
            next.set("tab", key);
            if (!key.startsWith("camp-proj-")) next.delete("participant");
            router.push(`/applications?${next.toString()}`, { scroll: false });
          }}
          variant="underline"
          className="min-w-max"
        />
      </div>

      {active.loadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
          {tf("failedToLoadHttp", lang, { status: active.loadError })}
        </div>
      ) : active.kind === "language-camp-group" && active.group ? (
        <LanguageCampProjectGroupView group={active.group} lang={lang} tabKey={active.key} />
      ) : active.kind === "university" && active.university ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {t("university", lang)}
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
                  href={`/applications/university/${active.id}/edit`}
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
                >
                  {t("editApplication", lang)}
                </Link>
              ) : null}
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <UniversityApplicationDetailView data={active.university} lang={lang} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">{t("loading", lang)}</p>
      )}
    </div>
  );
}
