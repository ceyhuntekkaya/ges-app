"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  adminDocumentRequirementsCreate,
  adminDocumentRequirementsDelete,
  adminDocumentRequirementsList,
  adminDocumentRequirementsUpdate,
  type AdminDocumentRequirementsListParams,
  type DocumentRequirementDto,
  type DocumentRequirementUpsertRequestDto,
} from "@/lib/api/generated/index";
import {
  Badge,
  Button,
  ConfirmDialog,
  Icon,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Switch,
  Table,
  Tabs,
  useToast,
} from "@/components/ui";

type Scope = NonNullable<DocumentRequirementDto["scope"]>;

const SCOPES = [
  "LANGUAGE_CAMP_APPLICATION",
  "LANGUAGE_CAMP_PARTICIPANT",
  "UNIVERSITY_APPLICATION",
  "UNIVERSITY_REFERENCE",
] as const satisfies Scope[];

const SCOPE_LABEL: Record<Scope, string> = {
  LANGUAGE_CAMP_APPLICATION: "Dil Kampı Başvuru",
  LANGUAGE_CAMP_PARTICIPANT: "Dil Kampı Katılımcı",
  UNIVERSITY_APPLICATION: "Üniversite Başvuru",
  UNIVERSITY_REFERENCE: "Üniversite Referans",
};

function clampInt(v: string | null, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function parseOptionalInt(v: string) {
  const t = v.trim();
  if (!t) return undefined;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

function requiredLabel(v?: boolean) {
  return v ? "Zorunlu" : "Opsiyonel";
}

function activeVariant(v?: boolean) {
  return v ? ("success" as const) : ("outline" as const);
}

type FormState = {
  scope: Scope;
  category: string;
  key: string;
  required: boolean;
  allowedContentTypes: string;
  maxSizeBytes: string;
  title: string;
  description: string;
  active: boolean;
};

function toInitialForm(scope: Scope, r?: DocumentRequirementDto): FormState {
  return {
    scope: r?.scope ?? scope,
    category: r?.category ?? "",
    key: r?.key ?? "",
    required: r?.required ?? true,
    allowedContentTypes: r?.allowedContentTypes ?? "",
    maxSizeBytes: r?.maxSizeBytes ? String(r.maxSizeBytes) : "",
    title: r?.title ?? "",
    description: r?.description ?? "",
    active: r?.active ?? true,
  };
}

function toUpsertDto(s: FormState): DocumentRequirementUpsertRequestDto {
  return {
    scope: s.scope,
    category: s.category.trim() || undefined,
    key: s.key.trim(),
    required: s.required,
    allowedContentTypes: s.allowedContentTypes.trim() || undefined,
    maxSizeBytes: parseOptionalInt(s.maxSizeBytes),
    title: s.title.trim() || undefined,
    description: s.description.trim() || undefined,
    active: s.active,
  };
}

export function AdminDocumentRequirementsClient() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  const scopeParam = (params.get("scope") as Scope | null) ?? null;
  const scope: Scope = (SCOPES as readonly string[]).includes(scopeParam ?? "")
    ? (scopeParam as Scope)
    : "LANGUAGE_CAMP_APPLICATION";

  const page = clampInt(params.get("page"), 0);
  const size = Math.min(200, Math.max(10, clampInt(params.get("size"), 50)));
  const category = (params.get("category") ?? "").trim();
  const q = (params.get("q") ?? "").trim().toLowerCase();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<DocumentRequirementDto[]>([]);
  const [total, setTotal] = React.useState(0);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DocumentRequirementDto | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(() => toInitialForm(scope));

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<DocumentRequirementDto | null>(null);

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

      const listParams: AdminDocumentRequirementsListParams = {
        scope,
        page,
        size,
        category: category || undefined,
      };

      const res = await adminDocumentRequirementsList(listParams).catch((e: unknown) => {
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
              const hay =
                `${x.key ?? ""} ${x.title ?? ""} ${x.description ?? ""} ${x.category ?? ""}`.toLowerCase();
              return hay.includes(q);
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
  }, [category, page, q, scope, size]);

  const openCreate = () => {
    setEditing(null);
    setForm(toInitialForm(scope));
    setModalOpen(true);
  };

  const openEdit = (r: DocumentRequirementDto) => {
    setEditing(r);
    setForm(toInitialForm(scope, r));
    setModalOpen(true);
  };

  const confirmDelete = (r: DocumentRequirementDto) => {
    setDeleteTarget(r);
    setDeleteOpen(true);
  };

  const canSubmit = form.key.trim().length > 0 && !saving;

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);

    const payload = toUpsertDto(form);
    const res = editing?.id
      ? await adminDocumentRequirementsUpdate(editing.id, payload).catch((e: unknown) => {
          return { status: 0, data: null, error: e instanceof Error ? e.message : "İstek başarısız" } as const;
        })
      : await adminDocumentRequirementsCreate(payload).catch((e: unknown) => {
          return { status: 0, data: null, error: e instanceof Error ? e.message : "İstek başarısız" } as const;
        });

    if (res.status >= 200 && res.status < 300) {
      toast.success({
        title: editing ? "Güncellendi" : "Oluşturuldu",
        description: payload.key,
      });
      setModalOpen(false);
      setEditing(null);
      router.refresh();
    } else {
      setError((res as unknown as { error?: string })?.error ?? `Kaydedilemedi (HTTP ${res.status})`);
    }

    setSaving(false);
  }

  async function doDelete() {
    const id = deleteTarget?.id;
    if (!id) return;
    setDeleting(true);
    const res = await adminDocumentRequirementsDelete(id).catch((e: unknown) => {
      return { status: 0, data: null, error: e instanceof Error ? e.message : "İstek başarısız" } as const;
    });
    if (res.status >= 200 && res.status < 300) {
      toast.success({ title: "Silindi", description: deleteTarget?.key ?? "" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast.error({ title: "Silinemedi", description: `HTTP ${res.status}` });
    }
    setDeleting(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Yönetim"
        title="Evrak Gereksinimleri"
        description="Her kapsam (scope) için istenen evrakları tanımlayın. Başvuru akışlarında checklist ve validasyon bu listeyi kullanır."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" leftIcon={<Icon name="arrow-up-down" size={16} />} onClick={() => router.refresh()}>
              Yenile
            </Button>
            <Button leftIcon={<Icon name="plus" size={16} />} onClick={openCreate}>
              Yeni Gereksinim
            </Button>
          </div>
        }
      />

      <Tabs<Scope>
        variant="underline"
        value={scope}
        onChange={(v) => setParam({ scope: v, page: "0" })}
        items={SCOPES.map((s) => ({
          value: s,
          label: SCOPE_LABEL[s],
          icon: <Icon name="filter" size={14} />,
        }))}
      />

      <Table<DocumentRequirementDto>
        title="Liste"
        searchable
        searchValue={q}
        searchPlaceholder="Key, başlık veya açıklama ile ara…"
        onSearchChange={(v) => setParam({ q: v || null, page: "0" })}
        toolbarActions={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="w-full sm:w-80">
              <Input
                inputSize="sm"
                value={category}
                onChange={(e) => setParam({ category: e.target.value || null, page: "0" })}
                placeholder="Kategori (opsiyonel) — ör: visa"
                leftIcon={<Icon name="filter" size={14} />}
                clearable
                onClear={() => setParam({ category: null, page: "0" })}
              />
            </div>
            {error ? <span className="text-xs text-[var(--danger-600)]">{error}</span> : null}
          </div>
        }
        loading={loading}
        data={data}
        rowKey={(row, idx) => row.id ?? `${row.key ?? "row"}-${idx}`}
        columns={[
          {
            key: "key",
            header: "Key",
            sortable: true,
            sortAccessor: (r) => r.key ?? "",
            cell: (r) => (
              <div className="min-w-0">
                <div className="truncate font-medium text-[var(--text-primary)]">{r.key ?? "-"}</div>
                <div className="truncate text-xs text-[var(--text-tertiary)]">{r.category ?? "-"}</div>
              </div>
            ),
            truncate: true,
          },
          {
            key: "title",
            header: "Başlık",
            sortable: true,
            sortAccessor: (r) => r.title ?? "",
            cell: (r) => <span className="text-[var(--text-primary)]">{r.title ?? "-"}</span>,
            truncate: true,
          },
          {
            key: "required",
            header: "Zorunluluk",
            sortable: true,
            sortAccessor: (r) => (r.required ? 1 : 0),
            cell: (r) => (
              <Badge variant={r.required ? "warning" : "outline"} dot>
                {requiredLabel(r.required)}
              </Badge>
            ),
            width: 140,
            hideOnMobile: true,
          },
          {
            key: "active",
            header: "Aktif",
            sortable: true,
            sortAccessor: (r) => (r.active ? 1 : 0),
            cell: (r) => (
              <Badge variant={activeVariant(r.active)} dot>
                {r.active ? "Aktif" : "Pasif"}
              </Badge>
            ),
            width: 110,
          },
          {
            key: "limits",
            header: "Limitler",
            sortable: true,
            sortAccessor: (r) => r.maxSizeBytes ?? 0,
            cell: (r) => (
              <div className="min-w-0 text-xs text-[var(--text-secondary)]">
                <div className="truncate">{r.allowedContentTypes ?? "-"}</div>
                <div className="tabular-nums text-[var(--text-tertiary)]">
                  {r.maxSizeBytes ? `${r.maxSizeBytes} B` : "-"}
                </div>
              </div>
            ),
            width: 260,
            hideOnMobile: true,
          },
        ]}
        onRowClick={(r) => openEdit(r)}
        rowActions={(r) => (
          <div className="flex items-center gap-1">
            <IconButton
              aria-label="Düzenle"
              variant="ghost"
              size="sm"
              icon={<Icon name="edit" size={14} />}
              onClick={() => openEdit(r)}
            />
            <IconButton
              aria-label="Sil"
              variant="ghost"
              size="sm"
              icon={<Icon name="trash" size={14} />}
              onClick={() => confirmDelete(r)}
            />
          </div>
        )}
        pagination={{
          page,
          pageSize: size,
          total,
          onPageChange: (p) => setParam({ page: String(p) }),
          onPageSizeChange: (s) => setParam({ size: String(s), page: "0" }),
          pageSizeOptions: [25, 50, 100, 200],
        }}
        emptyTitle="Gereksinim bulunamadı"
        emptyDescription="Scope veya kategori filtrelerini değiştirmeyi deneyin."
        emptyIcon={<Icon name="filter" size={18} />}
      />

      <Modal
        open={modalOpen}
        onClose={() => {
          setEditing(null);
          setModalOpen(false);
        }}
        title={editing ? "Gereksinim Güncelle" : "Yeni Gereksinim"}
        description={editing ? editing.key ?? "" : SCOPE_LABEL[scope]}
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Vazgeç
            </Button>
            <Button onClick={submit} disabled={!canSubmit} loading={saving}>
              Kaydet
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--danger-200)] bg-[var(--danger-50)] px-3 py-2 text-sm text-[var(--danger-700)]">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-[var(--text-tertiary)]">Scope</div>
              <Input
                inputSize="sm"
                value={SCOPE_LABEL[form.scope]}
                onChange={() => null}
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-[var(--text-tertiary)]">Kategori (opsiyonel)</div>
              <Input
                inputSize="sm"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                placeholder="visa, portfolio…"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-[var(--text-tertiary)]">Key *</div>
              <Input
                inputSize="sm"
                value={form.key}
                onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                placeholder="passport_scan"
              />
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-[var(--text-tertiary)]">Başlık</div>
              <Input
                inputSize="sm"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Pasaport (tarama)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-[var(--text-tertiary)]">Allowed content-types</div>
              <Input
                inputSize="sm"
                value={form.allowedContentTypes}
                onChange={(e) => setForm((p) => ({ ...p, allowedContentTypes: e.target.value }))}
                placeholder="application/pdf,image/*"
              />
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-[var(--text-tertiary)]">Max size (bytes)</div>
              <Input
                inputSize="sm"
                value={form.maxSizeBytes}
                onChange={(e) => setForm((p) => ({ ...p, maxSizeBytes: e.target.value }))}
                placeholder="10485760"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-medium text-[var(--text-tertiary)]">Açıklama</div>
            <Input
              inputSize="sm"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="PDF olarak yükleyin…"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Icon name="filter" size={14} />
              <span>Zorunlu</span>
            </div>
            <Switch checked={form.required} onChange={(v) => setForm((p) => ({ ...p, required: v }))} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Icon name="arrow-up-down" size={14} />
              <span>Aktif</span>
            </div>
            <Switch checked={form.active} onChange={(v) => setForm((p) => ({ ...p, active: v }))} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        title="Gereksinim silinsin mi?"
        description={`Bu işlem geri alınamaz. ${deleteTarget?.key ?? ""}`}
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        loading={deleting}
        onConfirm={doDelete}
      />
    </div>
  );
}

