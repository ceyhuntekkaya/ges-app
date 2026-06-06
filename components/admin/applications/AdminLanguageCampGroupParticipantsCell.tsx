"use client";

import type { LanguageCampApplicationListItemDto } from "@/lib/api/generated/index";
import { participantFullName } from "@/lib/applications/languageCampAdminGroups";
import { Badge } from "@/components/ui";

function statusLabel(status?: LanguageCampApplicationListItemDto["status"]) {
  switch (status) {
    case "DRAFT":
      return "Taslak";
    case "SUBMITTED":
      return "Onaylı";
    case "IN_REVIEW":
      return "İncelemede";
    case "MISSING_DOCUMENTS":
      return "Eksik Evrak";
    case "COMPLETED":
      return "Tamamlandı";
    case "REJECTED":
      return "Reddedildi";
    default:
      return status ?? "-";
  }
}

function statusVariant(status?: LanguageCampApplicationListItemDto["status"]) {
  switch (status) {
    case "DRAFT":
      return "neutral" as const;
    case "SUBMITTED":
      return "info" as const;
    case "IN_REVIEW":
      return "warning" as const;
    case "MISSING_DOCUMENTS":
      return "danger" as const;
    case "COMPLETED":
      return "success" as const;
    case "REJECTED":
      return "danger" as const;
    default:
      return "outline" as const;
  }
}

export function AdminLanguageCampGroupParticipantsCell({
  participants,
  participantCount,
}: {
  participants?: LanguageCampApplicationListItemDto[];
  participantCount?: number;
}) {
  const list = participants ?? [];
  const count = participantCount ?? list.length;

  if (!list.length) {
    return <span className="text-[var(--text-tertiary)]">-</span>;
  }

  if (count <= 1) {
    const p = list[0];
    return (
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-[var(--text-primary)]">
          {participantFullName(p)}
          {(p as LanguageCampApplicationListItemDto & { isItSelf?: boolean }).isItSelf ? (
            <span className="ml-1 text-xs text-[var(--text-tertiary)]">(başvuran)</span>
          ) : null}
        </span>
        {p.status ? (
          <Badge size="sm" variant={statusVariant(p.status)}>
            {statusLabel(p.status)}
          </Badge>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-[var(--text-secondary)]">{count} katılımcı</span>
      <ul className="space-y-1">
        {list.map((p, i) => (
          <li key={p.id ?? `participant-${i}`} className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm">
            <span className="truncate text-[var(--text-primary)]">
              {participantFullName(p)}
              {(p as LanguageCampApplicationListItemDto & { isItSelf?: boolean }).isItSelf ? (
                <span className="ml-1 text-xs text-[var(--text-tertiary)]">(başvuran)</span>
              ) : null}
            </span>
            {p.status ? (
              <Badge size="sm" variant={statusVariant(p.status)}>
                {statusLabel(p.status)}
              </Badge>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
