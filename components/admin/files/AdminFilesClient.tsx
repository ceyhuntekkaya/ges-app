"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Icon, IconButton, PageHeader, Select, Table, useToast } from "@/components/ui";

type StoredFilePurpose =
  | "OTHER"
  | "LANGUAGE_CAMP_GUARDIAN_CONSENT"
  | "VISA_BANK_STATEMENT"
  | "VISA_BIOMETRIC_PHOTO"
  | "UNIVERSITY_PORTFOLIO_DOCUMENT"
  | (string & {});

type StoredFileDto = {
  id?: string;
  purpose?: StoredFilePurpose;
  originalFilename?: string;
  contentType?: string;
  sizeBytes?: number;
  sha256?: string;
  uploadedByUserId?: string;
  createdAt?: string;
};

type PageDto<T> = {
  items?: T[];
  page?: number;
  size?: number;
  totalItems?: number;
  totalPages?: number;
};

function clampInt(v: string | null, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function formatBytes(n?: number) {
  if (!n || n <= 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function purposeLabel(p?: StoredFilePurpose) {
  switch (p) {
    case "LANGUAGE_CAMP_GUARDIAN_CONSENT":
      return "Dil Kampı Veli Onayı";
    case "VISA_BANK_STATEMENT":
      return "Vize Banka Dökümü";
    case "VISA_BIOMETRIC_PHOTO":
      return "Vize Biyometrik Fotoğraf";
    case "UNIVERSITY_PORTFOLIO_DOCUMENT":
      return "Üniversite Portfolyo";
    case "OTHER":
      return "Diğer";
    default:
      return p ?? "-";
  }
}

const PURPOSE_OPTIONS = [
  { value: "LANGUAGE_CAMP_GUARDIAN_CONSENT", label: "Dil Kampı Veli Onayı" },
  { value: "VISA_BANK_STATEMENT", label: "Vize Banka Dökümü" },
  { value: "VISA_BIOMETRIC_PHOTO", label: "Vize Biyometrik Fotoğraf" },
  { value: "UNIVERSITY_PORTFOLIO_DOCUMENT", label: "Üniversite Portfolyo" },
  { value: "OTHER", label: "Diğer" },
] as const satisfies Array<{ value: StoredFilePurpose; label: string }>;

async function fetchFiles(params: { page: number; size: number; q?: string; purpose?: string }) {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("size", String(params.size));
  if (params.q) sp.set("q", params.q);
  if (params.purpose) sp.set("purpose", params.purpose);

  const res = await fetch(`/api/proxy/v1/admin/files?${sp.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return (await res.json()) as PageDto<StoredFileDto>;
}

export function AdminFilesClient() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  const page = clampInt(params.get("page"), 0);
  const size = Math.min(100, Math.max(5, clampInt(params.get("size"), 25)));
  const purpose = (params.get("purpose") ?? "").trim() || null;
  const q = (params.get("q") ?? "").trim();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<StoredFileDto[]>([]);
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
        const res = await fetchFiles({ page, size, q: q || undefined, purpose: purpose || undefined });
        if (cancelled) return;
        const items = res.items ?? [];
        setData(items);
        setTotal(res.totalItems ?? items.length);
      } catch (e) {
        if (cancelled) return;
        setData([]);
        setTotal(0);
        setError(e instanceof Error ? e.message : "Liste yüklenemedi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [page, purpose, q, size]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Yönetim"
        title="Dosyalar"
        description="Sisteme yüklenen dosyaları listeleyin ve indirin."
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

      <Table<StoredFileDto>
        title="Liste"
        searchable
        searchValue={q}
        searchPlaceholder="Dosya adı veya ID ile ara…"
        onSearchChange={(v) => setParam({ q: v || null, page: "0" })}
        toolbarActions={
          <div className="flex items-center gap-2">
            <div className="w-60">
              <Select<string>
                size="sm"
                placeholder="Amaç (tümü)"
                clearable
                value={purpose}
                onChange={(v) => setParam({ purpose: v, page: "0" })}
                options={PURPOSE_OPTIONS as unknown as { value: string; label: string }[]}
              />
            </div>
            {error ? <span className="text-xs text-[var(--danger-600)]">{error}</span> : null}
          </div>
        }
        loading={loading}
        data={data}
        rowKey={(row) => row.id ?? crypto.randomUUID()}
        columns={[
          {
            key: "originalFilename",
            header: "Dosya",
            sortable: true,
            sortAccessor: (r) => `${r.originalFilename ?? ""}`.toLowerCase(),
            cell: (r) => (
              <div className="min-w-0">
                <div className="truncate font-medium text-[var(--text-primary)]">
                  {r.originalFilename ?? "-"}
                </div>
                <div className="truncate text-xs text-[var(--text-tertiary)]">{r.id ?? "-"}</div>
              </div>
            ),
            truncate: true,
          },
          {
            key: "purpose",
            header: "Amaç",
            sortable: true,
            sortAccessor: (r) => r.purpose ?? "",
            cell: (r) => (
              <Badge variant="outline" dot>
                {purposeLabel(r.purpose)}
              </Badge>
            ),
            width: 200,
            hideOnMobile: true,
          },
          {
            key: "contentType",
            header: "Tür",
            sortable: true,
            sortAccessor: (r) => r.contentType ?? "",
            cell: (r) => <span className="text-[var(--text-secondary)]">{r.contentType ?? "-"}</span>,
            width: 220,
            hideOnMobile: true,
          },
          {
            key: "sizeBytes",
            header: "Boyut",
            sortable: true,
            sortAccessor: (r) => r.sizeBytes ?? 0,
            cell: (r) => <span className="tabular-nums text-[var(--text-secondary)]">{formatBytes(r.sizeBytes)}</span>,
            width: 120,
            hideOnMobile: true,
          },
          {
            key: "createdAt",
            header: "Yüklendi",
            sortable: true,
            sortAccessor: (r) => r.createdAt ?? "",
            cell: (r) => <span className="tabular-nums text-[var(--text-secondary)]">{r.createdAt ?? "-"}</span>,
            width: 190,
            hideOnMobile: true,
          },
        ]}
        rowActions={(r) => {
          const id = r.id;
          return (
            <div className="flex items-center gap-1">
              <IconButton
                aria-label="ID kopyala"
                variant="ghost"
                size="sm"
                icon={<Icon name="copy" size={14} />}
                onClick={async () => {
                  if (!id) return;
                  await navigator.clipboard.writeText(id).catch(() => null);
                  toast.success({ title: "Kopyalandı", description: id });
                }}
              />
              {id ? (
                <a
                  className="inline-flex"
                  href={`/api/proxy/v1/admin/files/${id}/download`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <IconButton
                    aria-label="İndir"
                    variant="ghost"
                    size="sm"
                    icon={<Icon name="save" size={14} />}
                  />
                </a>
              ) : null}
            </div>
          );
        }}
        pagination={{
          page,
          pageSize: size,
          total,
          onPageChange: (p) => setParam({ page: String(p) }),
          onPageSizeChange: (s) => setParam({ size: String(s), page: "0" }),
          pageSizeOptions: [10, 25, 50, 100],
        }}
        emptyTitle="Dosya bulunamadı"
        emptyDescription="Filtreleri değiştirmeyi veya aramayı temizlemeyi deneyin."
        emptyIcon={<Icon name="save" size={18} />}
      />
    </div>
  );
}

