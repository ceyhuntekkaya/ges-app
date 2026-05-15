"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  adminUniversityApplicationsByStatus,
  AdminUniversityApplicationsByStatusStatus,
  type AdminUniversityApplicationsByStatusStatus as StatusFilter,
  type UniversityApplicationByStatusListItemDto,
} from "@/lib/api/generated/index";
import { Badge, Button, Card, CardDescription, CardTitle, Icon, Select, Skeleton, Table } from "@/components/ui";

function fullName(item: Pick<UniversityApplicationByStatusListItemDto, "applicantFirstName" | "applicantLastName">) {
  const n = `${item.applicantFirstName ?? ""} ${item.applicantLastName ?? ""}`.trim();
  return n || "-";
}

function statusLabel(status: StatusFilter) {
  switch (status) {
    case AdminUniversityApplicationsByStatusStatus.DRAFT:
      return "Taslak";
    case AdminUniversityApplicationsByStatusStatus.SUBMITTED:
      return "Gönderildi";
    case AdminUniversityApplicationsByStatusStatus.IN_REVIEW:
      return "İncelemede";
    case AdminUniversityApplicationsByStatusStatus.MISSING_DOCUMENTS:
      return "Eksik Evrak";
    case AdminUniversityApplicationsByStatusStatus.COMPLETED:
      return "Tamamlandı";
    case AdminUniversityApplicationsByStatusStatus.REJECTED:
      return "Reddedildi";
    default:
      return status;
  }
}

function statusVariant(status: StatusFilter) {
  switch (status) {
    case AdminUniversityApplicationsByStatusStatus.DRAFT:
      return "neutral" as const;
    case AdminUniversityApplicationsByStatusStatus.SUBMITTED:
      return "info" as const;
    case AdminUniversityApplicationsByStatusStatus.IN_REVIEW:
      return "warning" as const;
    case AdminUniversityApplicationsByStatusStatus.MISSING_DOCUMENTS:
      return "danger" as const;
    case AdminUniversityApplicationsByStatusStatus.COMPLETED:
      return "success" as const;
    case AdminUniversityApplicationsByStatusStatus.REJECTED:
      return "danger" as const;
    default:
      return "outline" as const;
  }
}

const STATUS_OPTIONS = [
  { value: AdminUniversityApplicationsByStatusStatus.DRAFT, label: "Taslak" },
  { value: AdminUniversityApplicationsByStatusStatus.SUBMITTED, label: "Gönderildi" },
  { value: AdminUniversityApplicationsByStatusStatus.IN_REVIEW, label: "İncelemede" },
  { value: AdminUniversityApplicationsByStatusStatus.MISSING_DOCUMENTS, label: "Eksik Evrak" },
  { value: AdminUniversityApplicationsByStatusStatus.COMPLETED, label: "Tamamlandı" },
  { value: AdminUniversityApplicationsByStatusStatus.REJECTED, label: "Reddedildi" },
] as const satisfies Array<{ value: StatusFilter; label: string }>;

function useApplicationsByStatus(status: StatusFilter) {
  const [data, setData] = React.useState<UniversityApplicationByStatusListItemDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    const res = await adminUniversityApplicationsByStatus({ status }).catch((e: unknown) => ({
      status: 0,
      data: [] as UniversityApplicationByStatusListItemDto[],
      error: e instanceof Error ? e.message : "İstek başarısız",
    }));

    if (res.status >= 200 && res.status < 300) {
      setData(res.data ?? []);
    } else {
      setData([]);
      setError((res as { error?: string }).error ?? `Yüklenemedi (HTTP ${res.status})`);
    }

    setLoading(false);
  }, [status]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export function AdminApplicationsByStatusClient() {
  const router = useRouter();
  const [status, setStatus] = React.useState<StatusFilter>(
    AdminUniversityApplicationsByStatusStatus.SUBMITTED,
  );
  const { data, loading, error, reload } = useApplicationsByStatus(status);

  return (
    <Card padding="none" elevated>
      <div className="flex flex-col gap-4 border-b border-[var(--border-default)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--info-50)] text-[var(--info-600)]">
            <Icon name="book" size={16} />
          </span>
          <div>
            <CardTitle>Başvurular</CardTitle>
            {!loading && !error && (
              <CardDescription className="mt-0.5">
                {data.length > 0
                  ? `${data.length} başvuru · ${statusLabel(status)}`
                  : `${statusLabel(status)} durumunda başvuru yok`}
              </CardDescription>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-48">
            <Select<StatusFilter>
              size="sm"
              value={status}
              onChange={(v) => v && setStatus(v)}
              options={STATUS_OPTIONS as unknown as { value: StatusFilter; label: string }[]}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon name="arrow-up-down" size={14} />}
            onClick={reload}
          >
            Yenile
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton shape="text" width="40%" />
              <Skeleton shape="text" width="30%" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-5 text-sm text-[var(--danger-600)]">
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </div>
      ) : (
        <Table<UniversityApplicationByStatusListItemDto>
          data={data}
          rowKey={(r) => r.id ?? crypto.randomUUID()}
          onRowClick={(r) => {
            if (!r.id) return;
            router.push(`/admin/university-applications/${encodeURIComponent(r.id)}`);
          }}
          columns={[
            {
              key: "applicant",
              header: "Başvurucu",
              sortable: true,
              sortAccessor: (r) => fullName(r).toLowerCase(),
              cell: (r) => (
                <span className="font-medium text-[var(--text-primary)]">{fullName(r)}</span>
              ),
              truncate: true,
            },
            {
              key: "followerPerson",
              header: "Takip Eden",
              sortable: true,
              sortAccessor: (r) => r.followerPerson ?? "",
              cell: (r) => (
                <span className="text-[var(--text-secondary)]">{r.followerPerson ?? "-"}</span>
              ),
              width: 200,
            },
            {
              key: "status",
              header: "Durum",
              cell: (r) => (
                <Badge variant={statusVariant((r.status ?? status) as StatusFilter)} dot size="sm">
                  {statusLabel((r.status ?? status) as StatusFilter)}
                </Badge>
              ),
              width: 140,
            },
          ]}
          emptyTitle="Başvuru bulunamadı"
          emptyDescription={`${statusLabel(status)} durumunda başvuru yok.`}
          emptyIcon={<Icon name="book" size={18} />}
        />
      )}
    </Card>
  );
}
