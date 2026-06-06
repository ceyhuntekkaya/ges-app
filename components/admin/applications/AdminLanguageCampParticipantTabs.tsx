"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { LanguageCampApplicationGroupParticipantSummary } from "@/lib/applications/languageCampAdminGroups";
import { participantFullName } from "@/lib/applications/languageCampAdminGroups";
import { Select, Tabs } from "@/components/ui";

type ParticipantStatus = NonNullable<LanguageCampApplicationGroupParticipantSummary["status"]>;

export function AdminLanguageCampParticipantTabs({
  activeId,
  participants,
  participantCount,
  applicantDisplayName,
  applicantEmail,
  projectTitle,
  statusOptions,
  onStatusChange,
  statusBusyId,
}: {
  activeId: string;
  participants?: LanguageCampApplicationGroupParticipantSummary[];
  participantCount?: number;
  applicantDisplayName?: string;
  applicantEmail?: string;
  projectTitle?: string;
  statusOptions: { value: ParticipantStatus; label: string }[];
  onStatusChange?: (participantId: string, status: ParticipantStatus) => void;
  statusBusyId?: string | null;
}) {
  const router = useRouter();
  const list = participants ?? [];
  const count = participantCount ?? list.length;

  if (count <= 1) return null;

  const tabItems = list.map((p) => ({
    value: p.id!,
    label: (
      <span className="inline-flex items-center gap-2">
        <span>{participantFullName(p)}</span>
        {p.isItSelf ? <span className="text-xs text-[var(--text-tertiary)]">(başvuran)</span> : null}
      </span>
    ),
  }));

  return (
    <section className="rounded-[var(--radius-2xl)] border border-[var(--border-subtle)] bg-[var(--surface-0)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            {projectTitle ?? "Dil kampı başvurusu"}
          </div>
          <div className="mt-1 text-sm text-[var(--text-secondary)]">
            {count} katılımcı
            {applicantDisplayName || applicantEmail ? (
              <>
                {" "}
                · Başvuran: {applicantDisplayName ?? applicantEmail}
                {applicantDisplayName && applicantEmail ? (
                  <span className="text-[var(--text-tertiary)]"> ({applicantEmail})</span>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <Tabs
          items={tabItems}
          value={activeId}
          onChange={(nextId) => {
            if (!nextId || nextId === activeId) return;
            router.push(`/admin/language-camp-applications/${encodeURIComponent(nextId)}`);
          }}
          variant="pill"
          className="min-w-max"
        />
      </div>

      {onStatusChange ? (
        <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            Katılımcı durumları
          </div>
          <ul className="mt-3 space-y-2">
            {list.map((p) => (
              <li
                key={p.id ?? participantFullName(p)}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] px-3 py-2"
              >
                <div className="min-w-0 text-sm text-[var(--text-primary)]">
                  {participantFullName(p)}
                  {p.isItSelf ? (
                    <span className="ml-1 text-xs text-[var(--text-tertiary)]">(başvuran)</span>
                  ) : null}
                  {p.id === activeId ? (
                    <span className="ml-2 text-xs font-medium text-[var(--accent-700)]">· seçili</span>
                  ) : null}
                </div>
                {p.id && p.status ? (
                  <div
                    className="w-48 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Select<ParticipantStatus>
                      size="sm"
                      value={p.status}
                      disabled={statusBusyId === p.id}
                      onChange={(v) => {
                        if (!v || !p.id || v === p.status) return;
                        onStatusChange(p.id, v);
                      }}
                      options={statusOptions}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
