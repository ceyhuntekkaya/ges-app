"use client";

import * as React from "react";
import {
  Badge,
  Button,
  ConfirmDialog,
  Icon,
  IconButton,
  Input,
  Modal,
  Table,
  useToast,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import {
  adminCatalogCountriesCreate,
  adminCatalogCountriesDelete,
  adminCatalogCountriesList,
  adminCatalogCountriesUpdate,
} from "@/lib/api/generated";
import type {
  AdminCatalogCountriesListParams,
  CountryDto,
  CountryUpsertRequestDto,
} from "@/lib/api/generated";
import { humanizeApiError, humanizeStatus } from "@/lib/api/errors";

const PAGE_SIZE_DEFAULT = 50;

type EditDraft = { code: string; name: string };
const emptyDraft = (): EditDraft => ({ code: "", name: "" });

export function CountriesPanel() {
  const toast = useToast();

  const [items, setItems] = React.useState<CountryDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE_DEFAULT);
  const [loading, setLoading] = React.useState(false);

  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState<EditDraft>(emptyDraft());
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createDraft, setCreateDraft] = React.useState<EditDraft>(emptyDraft());
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = React.useState<CountryDto | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q.trim());
      setPageIndex(0);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: AdminCatalogCountriesListParams = {
        page: pageIndex,
        size: pageSize,
      };
      if (debouncedQ) params.q = debouncedQ;
      const res = await adminCatalogCountriesList(params);
      if (res.status >= 200 && res.status < 300) {
        setItems(res.data.items ?? []);
        setTotal(res.data.totalItems ?? 0);
      } else {
        toast.error({
          title: "Ülkeler yüklenemedi",
          description: humanizeStatus(res.status),
        });
      }
    } catch (e) {
      toast.error({ title: "Ülkeler yüklenemedi", description: humanizeApiError(e) });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, debouncedQ, toast]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  function startEdit(row: CountryDto) {
    setEditingId(row.id ?? null);
    setEditDraft({ code: row.code ?? "", name: row.name ?? "" });
  }
  function cancelEdit() {
    setEditingId(null);
    setEditDraft(emptyDraft());
  }
  async function saveEdit(row: CountryDto) {
    if (!row.id) return;
    if (!editDraft.code.trim()) {
      toast.warning({ title: "Ülke kodu gerekli" });
      return;
    }
    if (!editDraft.name.trim()) {
      toast.warning({ title: "Ülke adı gerekli" });
      return;
    }
    setSavingId(row.id);
    try {
      const body: CountryUpsertRequestDto = {
        code: editDraft.code.trim().toUpperCase(),
        name: editDraft.name.trim(),
      };
      const res = await adminCatalogCountriesUpdate(row.id, body);
      if (res.status >= 200 && res.status < 300) {
        toast.success({ title: "Ülke güncellendi" });
        cancelEdit();
        await reload();
      } else {
        toast.error({ title: "Güncellenemedi", description: humanizeStatus(res.status) });
      }
    } catch (e) {
      toast.error({ title: "Güncellenemedi", description: humanizeApiError(e) });
    } finally {
      setSavingId(null);
    }
  }
  async function handleDelete() {
    if (!deleteTarget?.id) return;
    try {
      const res = await adminCatalogCountriesDelete(deleteTarget.id);
      if (res.status >= 200 && res.status < 300) {
        toast.success({ title: "Ülke silindi" });
        setDeleteTarget(null);
        await reload();
      } else {
        toast.error({ title: "Silinemedi", description: humanizeStatus(res.status) });
      }
    } catch (e) {
      toast.error({ title: "Silinemedi", description: humanizeApiError(e) });
    }
  }
  async function handleCreate() {
    setCreateError(null);
    if (!createDraft.code.trim()) {
      setCreateError("Ülke kodu gerekli.");
      return;
    }
    if (!createDraft.name.trim()) {
      setCreateError("Ülke adı gerekli.");
      return;
    }
    setCreating(true);
    try {
      const body: CountryUpsertRequestDto = {
        code: createDraft.code.trim().toUpperCase(),
        name: createDraft.name.trim(),
      };
      const res = await adminCatalogCountriesCreate(body);
      const status = res.status as number;
      if (status >= 200 && status < 300) {
        toast.success({ title: "Ülke eklendi" });
        setCreateOpen(false);
        setCreateDraft(emptyDraft());
        await reload();
      } else if (status === 409) {
        setCreateError("Bu ülke kodu zaten kayıtlı.");
      } else {
        setCreateError(humanizeStatus(status));
      }
    } catch (e) {
      setCreateError(humanizeApiError(e));
    } finally {
      setCreating(false);
    }
  }

  const columns: TableColumn<CountryDto>[] = [
    {
      key: "code",
      header: "Kod",
      width: 120,
      sortable: true,
      sortAccessor: (r) => r.code?.toLowerCase() ?? "",
      cell: (row) => {
        const isEditing = editingId === row.id;
        if (isEditing) {
          return (
            <Input
              autoFocus
              inputSize="sm"
              value={editDraft.code}
              onChange={(e) => setEditDraft((d) => ({ ...d, code: e.target.value }))}
              placeholder="TR"
              maxLength={8}
              style={{ textTransform: "uppercase" }}
            />
          );
        }
        return (
          <Badge variant="outline" size="md" className="font-mono tracking-wide">
            {row.code ?? "—"}
          </Badge>
        );
      },
    },
    {
      key: "name",
      header: "Ülke",
      sortable: true,
      sortAccessor: (r) => r.name?.toLowerCase() ?? "",
      cell: (row) => {
        const isEditing = editingId === row.id;
        if (isEditing) {
          return (
            <Input
              inputSize="sm"
              value={editDraft.name}
              onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Türkiye"
              maxLength={128}
            />
          );
        }
        return (
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-50)] text-[var(--accent-700)]">
              <Icon name="globe" size={14} />
            </span>
            <span className="truncate font-medium text-[var(--text-primary)]">
              {row.name ?? "—"}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      <Table<CountryDto>
        title="Ülkeler"
        columns={columns}
        data={items}
        rowKey={(r, idx) => r.id ?? `idx-${idx}`}
        loading={loading}
        sortable
        searchable
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Ülke ara..."
        toolbarActions={
          <Button
            size="sm"
            leftIcon={<Icon name="plus" size={14} />}
            onClick={() => {
              setCreateDraft(emptyDraft());
              setCreateError(null);
              setCreateOpen(true);
            }}
          >
            Yeni Ülke
          </Button>
        }
        pagination={{
          page: pageIndex + 1,
          pageSize,
          total,
          onPageChange: (p) => setPageIndex(p - 1),
          onPageSizeChange: (s) => {
            setPageSize(s);
            setPageIndex(0);
          },
        }}
        emptyTitle="Henüz ülke yok"
        emptyDescription="Başvurularda kullanılacak ülkeleri ekleyin."
        emptyIcon={<Icon name="globe" size={20} />}
        emptyAction={
          <Button
            size="sm"
            leftIcon={<Icon name="plus" size={14} />}
            onClick={() => {
              setCreateDraft(emptyDraft());
              setCreateOpen(true);
            }}
          >
            Yeni Ülke
          </Button>
        }
        rowActions={(row) => {
          const isEditing = editingId === row.id;
          const isSaving = savingId === row.id;
          if (isEditing) {
            return (
              <div className="flex items-center gap-1">
                <IconButton
                  aria-label="Kaydet"
                  variant="primary"
                  size="sm"
                  loading={isSaving}
                  icon={<Icon name="check" size={14} strokeWidth={2.4} />}
                  onClick={() => saveEdit(row)}
                />
                <IconButton
                  aria-label="Vazgeç"
                  variant="ghost"
                  size="sm"
                  icon={<Icon name="x" size={14} />}
                  onClick={cancelEdit}
                />
              </div>
            );
          }
          return (
            <div className="flex items-center gap-1">
              <IconButton
                aria-label="Düzenle"
                variant="ghost"
                size="sm"
                icon={<Icon name="edit" size={14} />}
                onClick={() => startEdit(row)}
              />
              <IconButton
                aria-label="Sil"
                variant="danger"
                size="sm"
                icon={<Icon name="trash" size={14} />}
                onClick={() => setDeleteTarget(row)}
              />
            </div>
          );
        }}
      />

      <Modal
        open={createOpen}
        onClose={() => (creating ? null : setCreateOpen(false))}
        title="Yeni Ülke"
        description="ISO ülke kodu (örn. TR, DE) ve görünen adı girin."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>
              Vazgeç
            </Button>
            <Button
              onClick={handleCreate}
              loading={creating}
              leftIcon={<Icon name="plus" size={14} />}
            >
              Ekle
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            containerClassName="sm:col-span-1"
            label="Kod"
            required
            value={createDraft.code}
            onChange={(e) =>
              setCreateDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))
            }
            placeholder="TR"
            maxLength={8}
            style={{ textTransform: "uppercase" }}
            hint="ISO Alpha-2/3"
          />
          <Input
            containerClassName="sm:col-span-2"
            label="Ülke adı"
            required
            value={createDraft.name}
            onChange={(e) => setCreateDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Türkiye"
            maxLength={128}
          />
          {createError ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--danger-100)] bg-[var(--danger-50)] px-3 py-2 text-xs text-[var(--danger-700)] sm:col-span-3">
              {createError}
            </div>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Ülke silinsin mi?"
        description={
          deleteTarget?.name
            ? `"${deleteTarget.name}" (${deleteTarget.code ?? ""}) kalıcı olarak silinecek. Bu ülkeye bağlı kayıtlar varsa işlem başarısız olabilir.`
            : "Bu işlem geri alınamaz."
        }
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        tone="danger"
      />
    </div>
  );
}
