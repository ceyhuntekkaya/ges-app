"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  adminUniversityApplicationsList,
  AdminUniversityApplicationsListStatus,
  type AdminUniversityApplicationsListParams,
  type UniversityApplicationListItemDto,
} from "@/lib/api/generated/index";
import { Badge, Button, Icon, PageHeader, Select, Table } from "@/components/ui";
import { formatTrDateTime } from "@/lib/dates/formatTr";

type StatusFilter = AdminUniversityApplicationsListStatus;

function statusLabel(status?: UniversityApplicationListItemDto["status"]) {
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

function statusVariant(status?: UniversityApplicationListItemDto["status"]) {
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

function educationLabel(level?: UniversityApplicationListItemDto["educationLevel"]) {
  switch (level) {
    case "BACHELOR":
      return "Lisans";
    case "MASTER":
      return "Yüksek Lisans";
    case "PHD":
      return "Doktora";
    default:
      return level ?? "-";
  }
}

function fullName(r: Pick<UniversityApplicationListItemDto, "firstName" | "lastName">) {
  const n = `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim();
  return n || "-";
}

function formatDate(iso?: string) {
  return formatTrDateTime(iso);
}

function numberToTrMoney(n: number): string {
  const [intRaw, frac] = n.toFixed(2).split(".");
  const intWithSep = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intWithSep},${frac}`;
}

function formatMoney(amount?: number) {
  if (amount == null || !Number.isFinite(Number(amount))) return "-";
  return numberToTrMoney(Number(amount));
}

function formatFeePaid(r: UniversityApplicationListItemDto) {
  const fee = formatMoney(r.priceAmount);
  const paid = formatMoney(r.totalPaidAmount);
  const currency = r.priceCurrency ? ` ${r.priceCurrency}` : "";
  if (fee === "-" && paid === "-") return "-";
  return (
    <span className="tabular-nums text-[var(--text-secondary)]">
      {fee}
      {currency}
      <span className="text-[var(--text-tertiary)]"> / </span>
      {paid}
      {currency}
    </span>
  );
}

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Taslak" },
  { value: "SUBMITTED", label: "Onaylı" },
  { value: "IN_REVIEW", label: "İncelemede" },
  { value: "MISSING_DOCUMENTS", label: "Eksik Evrak" },
  { value: "COMPLETED", label: "Tamamlandı" },
  { value: "REJECTED", label: "Reddedildi" },
] as const satisfies Array<{ value: StatusFilter; label: string }>;

function clampInt(v: string | null, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

export function AdminUniversityApplicationsClient() {
  const router = useRouter();
  const params = useSearchParams();

  const page = clampInt(params.get("page"), 0);
  const size = Math.min(100, Math.max(5, clampInt(params.get("size"), 25)));
  const status = (params.get("status") as StatusFilter | null) ?? null;
  const q = (params.get("q") ?? "").trim();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<UniversityApplicationListItemDto[]>([]);
  const [total, setTotal] = React.useState(0);

  const setParam = React.useCallback(
    (next: Record<string, string | null>) => {
      const sp = new URLSearchParams(params.toString());
      Object.entries(next).forEach(([k, v]) => {
        if (!v) sp.delete(k);
        else sp.set(k, v);
      });
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [params, router],
  );

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);

      const listParams: AdminUniversityApplicationsListParams = {
        page,
        size,
        status: status ?? undefined,
      };

      const res = await adminUniversityApplicationsList(listParams).catch((e: unknown) => {
        return {
          status: 0,
          data: null,
          error: e instanceof Error ? e.message : "İstek başarısız",
        } as const;
      });

      if (cancelled) return;

      if (res.status >= 200 && res.status < 300) {
        const items = res.data?.items ?? [];
        const filtered = q
          ? items.filter((x) => {
              const hay = `${x.id ?? ""} ${x.firstName ?? ""} ${x.lastName ?? ""}`.toLowerCase();
              return hay.includes(q.toLowerCase());
            })
          : items;
        setData(filtered);
        setTotal(res.data?.totalItems ?? filtered.length);
      } else {
        setData([]);
        setTotal(0);
        setError(
          (res as unknown as { error?: string })?.error ??
            `Liste yüklenemedi (HTTP ${res.status})`,
        );
      }

      setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [page, q, size, status]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Başvurular"
        title="Üniversite Başvuruları"
        description="Tüm üniversite başvurularını listeleyin, filtreleyin ve hızlıca kontrol edin."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" leftIcon={<Icon name="plus" size={16} />} onClick={() => router.push("/admin/university-applications/new")}>
              Yeni
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Icon name="arrow-up-down" size={16} />}
              onClick={() => router.refresh()}
            >
              Yenile
            </Button>
          </div>
        }
      />

      <Table<UniversityApplicationListItemDto>
        title="Liste"
        searchable
        searchValue={q}
        searchPlaceholder="Ad, soyad veya ID ile ara…"
        onSearchChange={(v) => setParam({ q: v || null, page: "0" })}
        toolbarActions={
          <div className="flex items-center gap-2">
            <div className="w-56">
              <Select<StatusFilter>
                size="sm"
                placeholder="Durum (tümü)"
                clearable
                value={status}
                onChange={(v) => setParam({ status: v, page: "0" })}
                options={STATUS_OPTIONS as unknown as { value: StatusFilter; label: string }[]}
              />
            </div>
            {error ? (
              <span className="text-xs text-[var(--danger-600)]">{error}</span>
            ) : null}
          </div>
        }
        loading={loading}
        data={data}
        rowKey={(row) => row.id ?? crypto.randomUUID()}
        onRowClick={(r) => {
          if (!r.id) return;
          router.push(`/admin/university-applications/${encodeURIComponent(r.id)}`);
        }}
        columns={[
          {
            key: "fullName",
            header: "Ad Soyad",
            sortable: true,
            sortAccessor: (r) => fullName(r).toLowerCase(),
            cell: (r) => <span className="text-[var(--text-primary)]">{fullName(r)}</span>,
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
            width: 140,
            hideOnMobile: true,
          },
          {
            key: "educationLevel",
            header: "Seviye",
            sortable: true,
            sortAccessor: (r) => r.educationLevel ?? "",
            cell: (r) => <span className="text-[var(--text-primary)]">{educationLabel(r.educationLevel)}</span>,
            width: 120,
            hideOnMobile: true,
          },
          {
            key: "status",
            header: "Durum",
            sortable: true,
            sortAccessor: (r) => r.status ?? "",
            cell: (r) => (
              <Badge variant={statusVariant(r.status)} dot>
                {statusLabel(r.status)}
              </Badge>
            ),
            width: 150,
          },
          {
            key: "feePaid",
            header: "Ücret / Ödenen",
            sortable: true,
            sortAccessor: (r) => r.priceAmount ?? 0,
            cell: (r) => formatFeePaid(r),
            width: 170,
            hideOnMobile: true,
          },
          {
            key: "tasks",
            header: "Görevler",
            sortable: true,
            sortAccessor: (r) => (r.pendingTaskCount ?? 0) + (r.completedTaskCount ?? 0),
            cell: (r) => {
              const pendingDates = r.pendingTaskScheduledAts ?? [];
              const hasTasks = (r.pendingTaskCount ?? 0) + (r.completedTaskCount ?? 0) > 0;
              if (!hasTasks) return <span className="text-[var(--text-tertiary)]">-</span>;
              return (
                <div className="flex flex-col gap-0.5 text-xs tabular-nums">
                  <span className="text-[var(--text-secondary)]">
                    Beklemede {r.pendingTaskCount ?? 0}
                  </span>
                  {pendingDates.map((d, i) => (
                    <span key={`${d}-${i}`} className="text-[var(--text-tertiary)]">
                      {formatDate(d)}
                    </span>
                  ))}
                  <span className="text-[var(--text-secondary)]">
                    Tamamlandı {r.completedTaskCount ?? 0}
                  </span>
                </div>
              );
            },
            width: 160,
            hideOnMobile: true,
          },
          {
            key: "meetingCount",
            header: "Görüşme",
            sortable: true,
            sortAccessor: (r) => r.meetingCount ?? 0,
            cell: (r) => (
              <span className="tabular-nums text-[var(--text-secondary)]">{r.meetingCount ?? 0}</span>
            ),
            width: 90,
            hideOnMobile: true,
          },
          {
            key: "documentCount",
            header: "Doküman",
            sortable: true,
            sortAccessor: (r) => r.documentCount ?? 0,
            cell: (r) => (
              <span className="tabular-nums text-[var(--text-secondary)]">
                {r.documentCount ?? 0}
                <span className="text-[var(--text-tertiary)]"> / </span>
                {r.documentsWithFileCount ?? 0}
              </span>
            ),
            width: 100,
            hideOnMobile: true,
          },
        ]}
        pagination={{
          page,
          pageSize: size,
          total,
          onPageChange: (p) => setParam({ page: String(p) }),
          onPageSizeChange: (s) => setParam({ size: String(s), page: "0" }),
          pageSizeOptions: [10, 25, 50, 100],
        }}
        emptyTitle="Başvuru bulunamadı"
        emptyDescription="Filtreleri değiştirmeyi veya aramayı temizlemeyi deneyin."
        emptyIcon={<Icon name="book" size={18} />}
      />
    </div>
  );
}

