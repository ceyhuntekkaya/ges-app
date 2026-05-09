"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Icon,
  IconButton,
  Input,
  PageHeader,
  Table,
  useToast,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import {
  adminCompaniesDelete,
  adminCompaniesList,
  type CompanyDto,
} from "@/lib/api/generated/index";
import { humanizeApiError, humanizeStatus } from "@/lib/api/errors";

type PageDto<T> = {
  items?: T[];
  page?: number;
  size?: number;
  totalItems?: number;
  totalPages?: number;
};

export function AdminCompaniesClient() {
  const toast = useToast();
  const router = useRouter();

  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState<CompanyDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(20);
  const [loading, setLoading] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminCompaniesList({
        q: q.trim() || undefined,
        page: pageIndex,
        size: pageSize,
      });
      if (res.status >= 200 && res.status < 300) {
        const data = res.data as unknown as PageDto<CompanyDto>;
        setItems(data.items ?? []);
        setTotal(data.totalItems ?? (data.items?.length ?? 0));
      } else {
        toast.error({ title: "Şirketler yüklenemedi", description: humanizeStatus(res.status) });
        setItems([]);
        setTotal(0);
      }
    } catch (e) {
      toast.error({ title: "Şirketler yüklenemedi", description: humanizeApiError(e) });
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, q, toast]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  const columns: TableColumn<CompanyDto>[] = [
    {
      key: "name",
      header: "Şirket",
      sortable: true,
      sortAccessor: (r) => (r.name ?? "").toLowerCase(),
      cell: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-[var(--text-primary)]">{r.name ?? "-"}</div>
          <div className="truncate text-xs text-[var(--text-tertiary)]">{r.code ?? "-"}</div>
        </div>
      ),
      truncate: true,
    },
    {
      key: "taxNumber",
      header: "Vergi No",
      sortable: true,
      sortAccessor: (r) => r.taxNumber ?? "",
      cell: (r) => <span className="text-[var(--text-secondary)]">{r.taxNumber ?? "-"}</span>,
      width: 160,
      hideOnMobile: true,
    },
    {
      key: "contact",
      header: "İletişim",
      sortable: true,
      sortAccessor: (r) => (r.contactFullName ?? "").toLowerCase(),
      cell: (r) => (
        <div className="min-w-0">
          <div className="truncate text-[var(--text-secondary)]">{r.contactFullName ?? "-"}</div>
          <div className="truncate text-xs text-[var(--text-tertiary)]">{r.contactEmail ?? r.contactPhone ?? ""}</div>
        </div>
      ),
      width: 260,
      hideOnMobile: true,
    },
  ];

  async function onDelete(id: string) {
    const ok = window.confirm("Bu şirket silinsin mi?");
    if (!ok) return;
    try {
      const res = await adminCompaniesDelete(id);
      if (res.status >= 200 && res.status < 300) {
        toast.success({ title: "Şirket silindi" });
        void reload();
      } else {
        toast.error({ title: "Silinemedi", description: humanizeStatus(res.status) });
      }
    } catch (e) {
      toast.error({ title: "Silinemedi", description: humanizeApiError(e) });
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Yönetim"
        title="Şirketler"
        description="Şirketleri listeleyin, ekleyin ve güncelleyin."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push("/admin/companies/new")}
              leftIcon={<Icon name="plus" size={16} />}
            >
              Yeni Şirket
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

      <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-xs)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <Input
            label="Ara"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Şirket adı ile ara…"
            leftIcon={<Icon name="search" size={16} />}
            containerClassName="md:max-w-[420px]"
            clearable
            onClear={() => setQ("")}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setPageIndex(0);
                void reload();
              }}
            >
              Ara
            </Button>
          </div>
        </div>
      </div>

      <Table<CompanyDto>
        title="Liste"
        loading={loading}
        data={items}
        rowKey={(row) => row.id ?? crypto.randomUUID()}
        columns={columns as unknown as TableColumn<CompanyDto>[]}
        rowActions={(r) => (
          <div className="flex items-center gap-1">
            <IconButton
              aria-label="Düzenle"
              variant="ghost"
              size="sm"
              icon={<Icon name="edit" size={14} />}
              onClick={() => {
                if (!r.id) return;
                router.push(`/admin/companies/${encodeURIComponent(r.id)}`);
              }}
            />
            <IconButton
              aria-label="Sil"
              variant="ghost"
              size="sm"
              icon={<Icon name="trash" size={14} />}
              onClick={() => {
                if (!r.id) return;
                void onDelete(r.id);
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
        emptyTitle="Şirket bulunamadı"
        emptyDescription="Yeni bir şirket ekleyebilir veya arama terimini değiştirebilirsiniz."
        emptyIcon={<Icon name="copy" size={18} />}
      />
    </div>
  );
}

