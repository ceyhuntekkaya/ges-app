"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  adminLanguageCampApplicationsList,
  AdminLanguageCampApplicationsListStatus,
  type AdminLanguageCampApplicationsListParams,
  type LanguageCampApplicationListItemDto,
} from "@/lib/api/generated";
import { Badge, Button, Icon, IconButton, PageHeader, Select, Table, useToast } from "@/components/ui";

type StatusFilter = AdminLanguageCampApplicationsListStatus;

function statusLabel(status?: LanguageCampApplicationListItemDto["status"]) {
  switch (status) {
    case "DRAFT":
      return "Taslak";
    case "SUBMITTED":
      return "Gönderildi";
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

function categoryLabel(cat?: LanguageCampApplicationListItemDto["category"]) {
  switch (cat) {
    case "INDIVIDUAL":
      return "Bireysel";
    case "CORPORATE":
      return "Kurumsal";
    case "FAMILY":
      return "Aile";
    default:
      return cat ?? "-";
  }
}

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Taslak" },
  { value: "SUBMITTED", label: "Gönderildi" },
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

export function AdminLanguageCampApplicationsClient() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  const page = clampInt(params.get("page"), 0);
  const size = Math.min(100, Math.max(5, clampInt(params.get("size"), 25)));
  const status = (params.get("status") as StatusFilter | null) ?? null;
  const q = (params.get("q") ?? "").trim();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<LanguageCampApplicationListItemDto[]>([]);
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

      const listParams: AdminLanguageCampApplicationsListParams = {
        page,
        size,
        status: status ?? undefined,
      };

      const res = await adminLanguageCampApplicationsList(listParams).catch((e: unknown) => {
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
          ? items.filter((x) => (x.id ?? "").toLowerCase().includes(q.toLowerCase()))
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
        title="Dil Kampı Başvuruları"
        description="Tüm dil kampı başvurularını listeleyin ve filtreleyin."
        actions={
          <Button
            variant="secondary"
            leftIcon={<Icon name="arrow-up-down" size={16} />}
            onClick={() => router.refresh()}
          >
            Yenile
          </Button>
        }
      />

      <Table<LanguageCampApplicationListItemDto>
        title="Liste"
        searchable
        searchValue={q}
        searchPlaceholder="ID ile ara…"
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
        columns={[
          {
            key: "id",
            header: "ID",
            sortable: true,
            sortAccessor: (r) => r.id ?? "",
            cell: (r) => (
              <span className="font-mono text-xs text-[var(--text-primary)]">{r.id ?? "-"}</span>
            ),
            truncate: true,
          },
          {
            key: "category",
            header: "Kategori",
            sortable: true,
            sortAccessor: (r) => r.category ?? "",
            cell: (r) => <span className="text-[var(--text-primary)]">{categoryLabel(r.category)}</span>,
            width: 160,
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
            width: 180,
          },
          {
            key: "updatedAt",
            header: "Güncellendi",
            sortable: true,
            sortAccessor: (r) => r.updatedAt ?? r.createdAt ?? "",
            cell: (r) => (
              <span className="tabular-nums text-[var(--text-secondary)]">
                {r.updatedAt ?? r.createdAt ?? "-"}
              </span>
            ),
            width: 190,
            hideOnMobile: true,
          },
        ]}
        rowActions={(r) => (
          <div className="flex items-center gap-1">
            <IconButton
              aria-label="ID kopyala"
              variant="ghost"
              size="sm"
              icon={<Icon name="copy" size={14} />}
              onClick={async () => {
                const id = r.id;
                if (!id) return;
                await navigator.clipboard.writeText(id).catch(() => null);
                toast.success({ title: "Kopyalandı", description: id });
              }}
            />
          </div>
        )}
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
        emptyIcon={<Icon name="globe" size={18} />}
      />
    </div>
  );
}

