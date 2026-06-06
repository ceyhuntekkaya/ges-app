"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminLanguageCampApplicationsListStatus } from "@/lib/api/generated/index";
import {
  fetchAdminLanguageCampApplicationGroups,
  groupMatchesQuery,
  type LanguageCampApplicationGroupListItem,
} from "@/lib/applications/languageCampAdminGroups";
import { AdminLanguageCampGroupParticipantsCell } from "@/components/admin/applications/AdminLanguageCampGroupParticipantsCell";
import { Badge, Button, Icon, IconButton, PageHeader, Select, Table, useToast } from "@/components/ui";
import { formatTrDateTime } from "@/lib/dates/formatTr";

type StatusFilter = AdminLanguageCampApplicationsListStatus;

function categoryLabel(cat?: LanguageCampApplicationGroupListItem["category"]) {
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

function aggregateFollower(group: LanguageCampApplicationGroupListItem) {
  const followers = (group.participants ?? [])
    .map((p) => p.followerPerson?.trim())
    .filter(Boolean) as string[];
  const unique = [...new Set(followers)];
  return unique.length ? unique.join(", ") : "-";
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
  const [data, setData] = React.useState<LanguageCampApplicationGroupListItem[]>([]);
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

      try {
        const res = await fetchAdminLanguageCampApplicationGroups({
          page,
          size,
          status: status ?? undefined,
        });
        if (cancelled) return;

        const items = res.items ?? [];
        const filtered = q ? items.filter((g) => groupMatchesQuery(g, q)) : items;
        setData(filtered);
        setTotal(q ? filtered.length : (res.totalItems ?? filtered.length));
      } catch (e) {
        if (!cancelled) {
          setData([]);
          setTotal(0);
          setError(e instanceof Error ? e.message : "Liste yüklenemedi");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [page, q, size, status]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Başvurular"
        title="Dil Kampı Başvuruları"
        description="Başvurular proje ve başvuran kullanıcıya göre gruplanır; her grupta birden fazla katılımcı olabilir."
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

      <Table<LanguageCampApplicationGroupListItem>
        title="Liste"
        searchable
        searchValue={q}
        searchPlaceholder="Başvuran, katılımcı, proje veya ID ile ara…"
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
            {error ? <span className="text-xs text-[var(--danger-600)]">{error}</span> : null}
          </div>
        }
        loading={loading}
        data={data}
        rowKey={(row) =>
          `${row.applicantUserId ?? "na"}-${row.languageCampProjectId ?? crypto.randomUUID()}`
        }
        onRowClick={(r) => {
          const targetId = r.primaryApplicationId ?? r.participants?.[0]?.id;
          if (!targetId) return;
          router.push(`/admin/language-camp-applications/${encodeURIComponent(targetId)}`);
        }}
        columns={[
          {
            key: "applicant",
            header: "Başvuran",
            sortable: true,
            sortAccessor: (r) => (r.applicantDisplayName ?? r.applicantEmail ?? "").toLowerCase(),
            cell: (r) => (
              <div className="min-w-0">
                <div className="truncate text-[var(--text-primary)]">
                  {r.applicantDisplayName ?? "-"}
                </div>
                {r.applicantEmail ? (
                  <div className="truncate text-xs text-[var(--text-tertiary)]">{r.applicantEmail}</div>
                ) : null}
              </div>
            ),
            truncate: true,
          },
          {
            key: "project",
            header: "Proje",
            sortable: true,
            sortAccessor: (r) => r.languageCampProjectTitle ?? "",
            cell: (r) => (
              <span className="text-[var(--text-primary)]">{r.languageCampProjectTitle ?? "-"}</span>
            ),
            truncate: true,
            hideOnMobile: true,
          },
          {
            key: "participants",
            header: "Katılımcılar",
            sortable: true,
            sortAccessor: (r) => r.participantCount ?? 0,
            cell: (r) => (
              <AdminLanguageCampGroupParticipantsCell
                participants={r.participants}
                participantCount={r.participantCount}
              />
            ),
            width: 260,
          },
          {
            key: "category",
            header: "Kategori",
            sortable: true,
            sortAccessor: (r) => r.category ?? "",
            cell: (r) => <span className="text-[var(--text-primary)]">{categoryLabel(r.category)}</span>,
            width: 120,
            hideOnMobile: true,
          },
          {
            key: "followerPerson",
            header: "Takip Eden",
            sortable: true,
            sortAccessor: (r) => aggregateFollower(r),
            cell: (r) => (
              <span className="text-[var(--text-secondary)]">{aggregateFollower(r)}</span>
            ),
            width: 140,
            hideOnMobile: true,
          },
          {
            key: "participantCount",
            header: "Kişi",
            sortable: true,
            sortAccessor: (r) => r.participantCount ?? 0,
            cell: (r) => (
              <Badge variant={r.participantCount && r.participantCount > 1 ? "info" : "neutral"}>
                {r.participantCount ?? 0}
              </Badge>
            ),
            width: 72,
            hideOnMobile: true,
          },
          {
            key: "updatedAt",
            header: "Güncellendi",
            sortable: true,
            sortAccessor: (r) => r.updatedAt ?? r.createdAt ?? "",
            cell: (r) => (
              <span className="tabular-nums text-[var(--text-secondary)]">
                {formatTrDateTime(r.updatedAt ?? r.createdAt)}
              </span>
            ),
            width: 190,
            hideOnMobile: true,
          },
        ]}
        rowActions={(r) => (
          <div className="flex items-center gap-1">
            <IconButton
              aria-label="Grup anahtarını kopyala"
              variant="ghost"
              size="sm"
              icon={<Icon name="copy" size={14} />}
              onClick={async () => {
                const key = `${r.applicantUserId ?? ""}:${r.languageCampProjectId ?? ""}`;
                if (!key || key === ":") return;
                await navigator.clipboard.writeText(key).catch(() => null);
                toast.success({ title: "Kopyalandı", description: key });
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
