"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { LanguageCampApplicationGroupDto } from "@/lib/api/portalServer";
import { AddLanguageCampParticipantModal } from "@/components/applications/AddLanguageCampParticipantModal";
import { LanguageCampParticipantPanel } from "@/components/applications/LanguageCampParticipantPanel";
import { LanguageCampProjectPaymentsPanel } from "@/components/applications/LanguageCampProjectPaymentsPanel";
import { Badge, Button, Icon, Tabs } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui/Badge";
import {
  firstProjectImage,
  formatCampDate,
  formatCampMoney,
  participantLabel,
  resolveMediaUrl,
  stripHtml,
} from "@/lib/applications/languageCampDisplay";
import type { Lang } from "@/lib/i18n/dict";
import { t } from "@/lib/i18n/dict";
import { labelApplicationStatus, labelLanguageCampCategory } from "@/lib/i18n/labels";

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

export function LanguageCampProjectGroupView({
  group,
  lang,
  tabKey,
}: {
  group: LanguageCampApplicationGroupDto;
  lang: Lang;
  tabKey: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const project = group.project;
  const participants = group.participants ?? [];
  const projectId = group.projectId ?? project?.id ?? "";

  const paramParticipant = searchParams.get("participant");
  const firstId = participants[0]?.id ?? "";
  const activeParticipantId = participants.some((p) => p.id === paramParticipant)
    ? (paramParticipant as string)
    : firstId;
  const activeParticipant = participants.find((p) => p.id === activeParticipantId) ?? participants[0];

  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const referenceParticipant = participants[0];

  const hero = firstProjectImage(project);
  const price = formatCampMoney(project?.price, project?.currency, lang);
  const original = formatCampMoney(project?.originalPrice, project?.currency, lang);
  const appWindow = [formatCampDate(project?.applicationStartAt, lang), formatCampDate(project?.applicationEndAt, lang)]
    .filter(Boolean)
    .join(" – ");
  const campWindow = [formatCampDate(project?.projectStartAt, lang), formatCampDate(project?.projectEndAt, lang)]
    .filter(Boolean)
    .join(" – ");

  const participantTabs = participants.map((p) => ({
    value: p.id!,
    label: participantLabel(p, lang),
    badge: p.status ? (
      <Badge size="sm" variant={statusBadgeVariant(p.status)}>
        {labelApplicationStatus(p.status, lang)}
      </Badge>
    ) : undefined,
  }));

  function onParticipantCreated(participantId: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", tabKey);
    next.set("participant", participantId);
    router.push(`/applications?${next.toString()}`);
    router.refresh();
  }

  const description = stripHtml(project?.description);
  const highlights = (project?.highlights ?? []).filter(Boolean);
  const included = (project?.included ?? []).filter(Boolean);

  return (
    <div className="grid gap-8">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 shadow-lg">
        <div className="relative">
          {hero ? (
            <img src={hero} alt={project?.title ?? ""} className="h-56 w-full object-cover sm:h-72" />
          ) : (
            <div className="h-56 bg-gradient-to-br from-sky-600 via-teal-600 to-emerald-700 sm:h-72" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0 text-white">
                <div className="text-xs font-medium uppercase tracking-widest text-white/70">
                  {t("languageCamp", lang)}
                </div>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{project?.title ?? "-"}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/85">
                  {project?.location ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 backdrop-blur-sm">
                      <Icon name="map-pin" size={14} />
                      {project.location}
                    </span>
                  ) : null}
                  {project?.duration ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 backdrop-blur-sm">
                      <Icon name="clock" size={14} />
                      {project.duration}
                    </span>
                  ) : null}
                  {participants[0]?.category ? (
                    <Badge variant="outline" size="sm" className="border-white/30 bg-white/10 text-white">
                      {labelLanguageCampCategory(participants[0].category, lang)}
                    </Badge>
                  ) : null}
                </div>
              </div>
              {price ? (
                <div className="rounded-xl bg-white/95 px-4 py-3 text-right shadow-lg backdrop-blur">
                  <div className="text-xs font-medium text-zinc-500">{t("priceAmount", lang)}</div>
                  <div className="text-xl font-bold text-zinc-900">{price}</div>
                  {original && original !== price ? (
                    <div className="text-sm text-zinc-400 line-through">{original}</div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {(appWindow || campWindow) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {appWindow ? (
            <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-white to-sky-50/50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {t("applicationWindow", lang)}
              </div>
              <p className="mt-1 text-sm font-medium text-zinc-900">{appWindow}</p>
            </div>
          ) : null}
          {campWindow ? (
            <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-white to-emerald-50/50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t("campDates", lang)}</div>
              <p className="mt-1 text-sm font-medium text-zinc-900">{campWindow}</p>
            </div>
          ) : null}
        </div>
      )}

      {(description || highlights.length > 0 || included.length > 0) && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-zinc-900">{t("projectDetails", lang)}</h3>
          {description ? <p className="mt-3 text-sm leading-7 text-zinc-600">{description}</p> : null}
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            {highlights.length > 0 ? (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t("highlights", lang)}</h4>
                <ul className="mt-3 space-y-2">
                  {highlights.map((item, i) => (
                    <li key={`${item}-${i}`} className="flex gap-2 text-sm text-zinc-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {included.length > 0 ? (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t("included", lang)}</h4>
                <ul className="mt-3 space-y-2">
                  {included.map((item, i) => (
                    <li key={`${item}-${i}`} className="flex gap-2 text-sm text-zinc-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          {(project?.images ?? []).length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(project?.images ?? []).slice(0, 4).map((src, i) => {
                const url = resolveMediaUrl(src);
                if (!url) return null;
                return (
                  <img
                    key={`${url}-${i}`}
                    src={url}
                    alt=""
                    className="aspect-[4/3] rounded-lg object-cover ring-1 ring-zinc-200"
                  />
                );
              })}
            </div>
          ) : null}
        </section>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900">{t("participants", lang)}</h3>
            <p className="mt-1 text-sm text-zinc-500">
              {participants.length} {lang === "tr" ? "kişi" : "people"}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={!projectId}
            onClick={() => setAddModalOpen(true)}
            leftIcon={<Icon name="plus" size={16} />}
          >
            {t("addParticipant", lang)}
          </Button>
        </div>

        <AddLanguageCampParticipantModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          projectId={projectId}
          referenceParticipant={referenceParticipant}
          lang={lang}
          onCreated={onParticipantCreated}
        />

        {participantTabs.length > 0 ? (
          <>
            <div className="mt-4 overflow-x-auto">
              <Tabs
                items={participantTabs}
                value={activeParticipantId}
                onChange={(id) => {
                  const next = new URLSearchParams(searchParams.toString());
                  next.set("tab", tabKey);
                  next.set("participant", id);
                  router.push(`/applications?${next.toString()}`, { scroll: false });
                }}
                variant="pill"
                className="min-w-max"
              />
            </div>

            {activeParticipant ? (
              <div className="mt-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-zinc-900">
                    {participantLabel(activeParticipant, lang)}
                  </h4>
                  {activeParticipant.status === "DRAFT" && activeParticipant.id ? (
                    <Link
                      href={`/applications/language-camp/${activeParticipant.id}/edit`}
                      className="text-sm font-medium text-teal-700 hover:text-teal-900"
                    >
                      {t("editParticipant", lang)} →
                    </Link>
                  ) : null}
                </div>
                <LanguageCampParticipantPanel participant={activeParticipant} lang={lang} />
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">{t("noItems", lang)}</p>
        )}
      </section>

      {participants.length > 0 ? (
        <LanguageCampProjectPaymentsPanel participants={participants} lang={lang} />
      ) : null}
    </div>
  );
}
