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
import { humanizeApiError } from "@/lib/api/errors";

type StatusFilter = AdminLanguageCampApplicationsListStatus;

type ProjectDetail = {
  id?: string;
  title?: string;
  quota?: number;
  applicationCount?: number;
};

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

async function fetchProject(id: string) {
  const res = await fetch(`/api/proxy/v1/admin/language-camp-projects/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return (await res.json()) as ProjectDetail;
}

function aggregateFollower(group: LanguageCampApplicationGroupListItem) {
  const followers = (group.participants ?? [])
    .map((p) => p.followerPerson?.trim())
    .filter(Boolean) as string[];
  const unique = [...new Set(followers)];
  return unique.length ? unique.join(", ") : "-";
}

function totalParticipants(groups: LanguageCampApplicationGroupListItem[]) {
  return groups.reduce((sum, g) => sum + (g.participantCount ?? g.participants?.length ?? 0), 0);
}

export function AdminLanguageCampProjectApplicationsClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  const page = clampInt(params.get("page"), 0);
  const size = Math.min(100, Math.max(5, clampInt(params.get("size"), 25)));
  const status = (params.get("status") as StatusFilter | null) ?? null;
  const q = (params.get("q") ?? "").trim();

  const [projectLoading, setProjectLoading] = React.useState(true);
  const [project, setProject] = React.useState<ProjectDetail | null>(null);
  const [projectError, setProjectError] = React.useState<string | null>(null);

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
      setProjectLoading(true);
      setProjectError(null);
      try {
        const detail = await fetchProject(projectId);
        if (!cancelled) setProject(detail);
      } catch (e) {
        if (!cancelled) {
          setProject(null);
          setProjectError(humanizeApiError(e));
        }
      } finally {
        if (!cancelled) setProjectLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

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
          languageCampProjectId: projectId,
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
          setError(humanizeApiError(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [page, projectId, q, size, status]);

  const quota = project?.quota;
  const groupCount = total;
  const participantCountOnPage = totalParticipants(data);
  const countLabel =
    quota !== undefined && quota !== null
      ? `${groupCount} başvuru · ${participantCountOnPage} katılımcı (sayfa) / kota ${quota}`
      : `${groupCount} başvuru grubu`;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Dil Kampı Projeleri"
        title={projectLoading ? "Başvurular" : (project?.title ?? "Başvurular")}
        description={
          projectError ? (
            <span className="text-[var(--danger-600)]">{projectError}</span>
          ) : (
            `Bu projeye yapılan başvurular · ${countLabel}`
          )
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={<Icon name="arrow-left" size={16} />}
              onClick={() => router.push("/admin/language-camp-projects")}
            >
              Projelere dön
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Icon name="edit" size={16} />}
              onClick={() =>
                router.push(`/admin/language-camp-projects/${encodeURIComponent(projectId)}`)
              }
            >
              Projeyi düzenle
            </Button>
          </div>
        }
      />

      <Table<LanguageCampApplicationGroupListItem>
        title="Başvurular"
        searchable
        searchValue={q}
        searchPlaceholder="Başvuran, katılımcı veya ID ile ara…"
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
            width: 280,
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
        emptyDescription="Bu projeye henüz başvuru yapılmamış olabilir."
        emptyIcon={<Icon name="globe" size={18} />}
      />
    </div>
  );
}
