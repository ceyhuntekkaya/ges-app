"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Icon,
  IconButton,
  PageHeader,
  Table,
  useToast,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import type { EProjectStatus, EProjectType } from "./LanguageCampProjectForm";
import { humanizeApiError } from "@/lib/api/errors";

type PageDto<T> = {
  items?: T[];
  page?: number;
  size?: number;
  totalItems?: number;
  totalPages?: number;
};

type LanguageCampProjectDto = {
  id?: string;
  title?: string;
  companyId?: string;
  individual?: boolean;
  projectStatus?: EProjectStatus;
  projectType?: EProjectType;
  quota?: number;
  applicationCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

async function fetchProjects(params: { page: number; size: number }) {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("size", String(params.size));

  const res = await fetch(`/api/proxy/v1/admin/language-camp-projects?${sp.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return (await res.json()) as PageDto<LanguageCampProjectDto>;
}

function statusLabel(s?: EProjectStatus) {
  switch (s) {
    case "ACTIVE":
      return "Aktif";
    case "INACTIVE":
      return "Pasif";
    case "DELETED":
      return "Silinmiş";
    default:
      return s ?? "-";
  }
}

function statusVariant(s?: EProjectStatus) {
  switch (s) {
    case "ACTIVE":
      return "success" as const;
    case "INACTIVE":
      return "warning" as const;
    case "DELETED":
      return "danger" as const;
    default:
      return "outline" as const;
  }
}

export function AdminLanguageCampProjectsClient() {
  const toast = useToast();
  const router = useRouter();

  const [items, setItems] = React.useState<LanguageCampProjectDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(20);
  const [loading, setLoading] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchProjects({ page: pageIndex, size: pageSize });
      setItems(res.items ?? []);
      setTotal(res.totalItems ?? (res.items?.length ?? 0));
    } catch (e) {
      toast.error({ title: "Projeler yüklenemedi", description: humanizeApiError(e) });
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, toast]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const columns: TableColumn<LanguageCampProjectDto>[] = [
    {
      key: "title",
      header: "Proje",
      sortable: true,
      sortAccessor: (r) => (r.title ?? "").toLowerCase(),
      cell: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-[var(--text-primary)]">{r.title ?? "-"}</div>
          <div className="truncate text-xs text-[var(--text-tertiary)]">{r.id ?? "-"}</div>
        </div>
      ),
      truncate: true,
    },
    {
      key: "status",
      header: "Durum",
      sortable: true,
      sortAccessor: (r) => r.projectStatus ?? "",
      cell: (r) => (
        <Badge variant={statusVariant(r.projectStatus)} dot>
          {statusLabel(r.projectStatus)}
        </Badge>
      ),
      width: 160,
      hideOnMobile: true,
    },
    {
      key: "individual",
      header: "Tür",
      sortable: true,
      sortAccessor: (r) => String(r.individual ?? false),
      cell: (r) => (
        <span className="text-[var(--text-secondary)]">{r.individual ? "Bireysel" : "Kurumsal"}</span>
      ),
      width: 140,
    },
    {
      key: "companyId",
      header: "Şirket",
      sortable: true,
      sortAccessor: (r) => r.companyId ?? "",
      cell: (r) => <span className="text-[var(--text-secondary)]">{r.companyId ?? "-"}</span>,
      width: 220,
      hideOnMobile: true,
    },
    {
      key: "applications",
      header: "Başvurular",
      sortable: true,
      sortAccessor: (r) => r.applicationCount ?? 0,
      cell: (r) => {
        const count = r.applicationCount ?? 0;
        const quota = r.quota;
        const label =
          quota !== undefined && quota !== null
            ? `${count} / ${quota}`
            : String(count);
        if (!r.id) {
          return <span className="tabular-nums text-[var(--text-secondary)]">{label}</span>;
        }
        return (
          <button
            type="button"
            className="block w-full rounded-md px-1 py-0.5 text-left tabular-nums text-[var(--accent-700)] underline-offset-2 transition-colors hover:bg-[var(--surface-2)] hover:underline"
            onClick={() => {
              router.push(
                `/admin/language-camp-projects/${encodeURIComponent(r.id!)}/applications`,
              );
            }}
          >
            {label}
          </button>
        );
      },
      width: 120,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Yönetim"
        title="Dil Kampı Projeleri"
        description="Projeleri listeleyin, ekleyin ve güncelleyin."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push("/admin/language-camp-projects/new")}
              leftIcon={<Icon name="plus" size={16} />}
            >
              Yeni Proje
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Icon name="arrow-up-down" size={16} />}
              onClick={() => void reload()}
            >
              Yenile
            </Button>
          </div>
        }
      />

      <Table<LanguageCampProjectDto>
        title="Liste"
        loading={loading}
        data={items}
        rowKey={(row) => row.id ?? crypto.randomUUID()}
        columns={columns as unknown as TableColumn<LanguageCampProjectDto>[]}
        rowActions={(r) => (
          <div className="flex items-center gap-1">
            <IconButton
              aria-label="Düzenle"
              variant="ghost"
              size="sm"
              icon={<Icon name="edit" size={14} />}
              onClick={() => {
                if (!r.id) return;
                router.push(`/admin/language-camp-projects/${encodeURIComponent(r.id)}`);
              }}
            />
          </div>
        )}
        pagination={{
          page: pageIndex,
          pageSize,
          total,
          onPageChange: (p) => setPageIndex(p),
          onPageSizeChange: (s) => {
            setPageSize(s);
            setPageIndex(0);
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
        emptyTitle="Proje bulunamadı"
        emptyDescription="Yeni bir proje ekleyebilir veya daha sonra tekrar deneyebilirsiniz."
        emptyIcon={<Icon name="globe" size={18} />}
      />
    </div>
  );
}

