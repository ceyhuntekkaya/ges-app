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
  Switch,
  Table,
  useToast,
} from "@/components/ui";
import type { TableColumn } from "@/components/ui";
import {
  adminCatalogDepartmentsCreate,
  adminCatalogDepartmentsDelete,
  adminCatalogDepartmentsList,
  adminCatalogDepartmentsUpdate,
} from "@/lib/api/generated";
import type {
  AdminCatalogDepartmentsListParams,
  DepartmentDto,
  DepartmentUpsertRequestDto,
} from "@/lib/api/generated";
import { humanizeApiError, humanizeStatus } from "@/lib/api/errors";

const PAGE_SIZE_DEFAULT = 50;

type EditDraft = { name: string; active: boolean };
const emptyDraft = (): EditDraft => ({ name: "", active: true });

export function DepartmentsPanel() {
  const toast = useToast();

  const [items, setItems] = React.useState<DepartmentDto[]>([]);
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

  const [deleteTarget, setDeleteTarget] = React.useState<DepartmentDto | null>(null);

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
      const params: AdminCatalogDepartmentsListParams = {
        page: pageIndex,
        size: pageSize,
      };
      if (debouncedQ) params.q = debouncedQ;
      const res = await adminCatalogDepartmentsList(params);
      if (res.status >= 200 && res.status < 300) {
        setItems(res.data.items ?? []);
        setTotal(res.data.totalItems ?? 0);
      } else {
        toast.error({
          title: "Bölümler yüklenemedi",
          description: humanizeStatus(res.status),
        });
      }
    } catch (e) {
      toast.error({ title: "Bölümler yüklenemedi", description: humanizeApiError(e) });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, debouncedQ, toast]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  function startEdit(row: DepartmentDto) {
    setEditingId(row.id ?? null);
    setEditDraft({ name: row.name ?? "", active: row.active ?? true });
  }
  function cancelEdit() {
    setEditingId(null);
    setEditDraft(emptyDraft());
  }
  async function saveEdit(row: DepartmentDto) {
    if (!row.id) return;
    if (!editDraft.name.trim()) {
      toast.warning({ title: "Bölüm adı gerekli" });
      return;
    }
    setSavingId(row.id);
    try {
      const body: DepartmentUpsertRequestDto = {
        name: editDraft.name.trim(),
        active: editDraft.active,
      };
      const res = await adminCatalogDepartmentsUpdate(row.id, body);
      if (res.status >= 200 && res.status < 300) {
        toast.success({ title: "Bölüm güncellendi" });
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
      const res = await adminCatalogDepartmentsDelete(deleteTarget.id);
      if (res.status >= 200 && res.status < 300) {
        toast.success({ title: "Bölüm silindi" });
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
    if (!createDraft.name.trim()) {
      setCreateError("Bölüm adı gerekli.");
      return;
    }
    setCreating(true);
    try {
      const body: DepartmentUpsertRequestDto = {
        name: createDraft.name.trim(),
        active: createDraft.active,
      };
      const res = await adminCatalogDepartmentsCreate(body);
      if (res.status >= 200 && res.status < 300) {
        toast.success({ title: "Bölüm eklendi" });
        setCreateOpen(false);
        setCreateDraft(emptyDraft());
        await reload();
      } else {
        setCreateError(humanizeStatus(res.status));
      }
    } catch (e) {
      setCreateError(humanizeApiError(e));
    } finally {
      setCreating(false);
    }
  }

  const columns: TableColumn<DepartmentDto>[] = [
    {
      key: "name",
      header: "Bölüm",
      sortable: true,
      sortAccessor: (r) => r.name?.toLowerCase() ?? "",
      cell: (row) => {
        const isEditing = editingId === row.id;
        if (isEditing) {
          return (
            <Input
              autoFocus
              inputSize="sm"
              value={editDraft.name}
              onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Bölüm adı"
            />
          );
        }
        return (
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-50)] text-[var(--accent-700)]">
              <Icon name="book" size={14} />
            </span>
            <span className="truncate font-medium text-[var(--text-primary)]">
              {row.name ?? "—"}
            </span>
          </div>
        );
      },
    },
    {
      key: "active",
      header: "Durum",
      width: 130,
      cell: (row) => {
        const isEditing = editingId === row.id;
        if (isEditing) {
          return (
            <Switch
              size="sm"
              checked={editDraft.active}
              onChange={(v) => setEditDraft((d) => ({ ...d, active: v }))}
              label={editDraft.active ? "Aktif" : "Pasif"}
            />
          );
        }
        return row.active ? (
          <Badge variant="success" size="sm" dot>
            Aktif
          </Badge>
        ) : (
          <Badge variant="neutral" size="sm" dot>
            Pasif
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      <Table<DepartmentDto>
        title="Bölümler"
        columns={columns}
        data={items}
        rowKey={(r, idx) => r.id ?? `idx-${idx}`}
        loading={loading}
        sortable
        searchable
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Bölüm ara..."
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
            Yeni Bölüm
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
        emptyTitle="Henüz bölüm yok"
        emptyDescription="Üniversite başvurularında kullanılacak bölümleri tanımlayın."
        emptyIcon={<Icon name="book" size={20} />}
        emptyAction={
          <Button
            size="sm"
            leftIcon={<Icon name="plus" size={14} />}
            onClick={() => {
              setCreateDraft(emptyDraft());
              setCreateOpen(true);
            }}
          >
            Yeni Bölüm
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
        title="Yeni Bölüm"
        description="Üniversite başvurularında seçilebilecek bir bölüm tanımlayın."
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
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Bölüm adı"
            required
            value={createDraft.name}
            onChange={(e) => setCreateDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Örn: Bilgisayar Mühendisliği"
            maxLength={255}
          />
          <Switch
            checked={createDraft.active}
            onChange={(v) => setCreateDraft((d) => ({ ...d, active: v }))}
            label="Aktif olarak ekle"
            description="Pasif bölümler kullanıcıya gösterilmez."
          />
          {createError ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--danger-100)] bg-[var(--danger-50)] px-3 py-2 text-xs text-[var(--danger-700)]">
              {createError}
            </div>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Bölüm silinsin mi?"
        description={
          deleteTarget?.name
            ? `"${deleteTarget.name}" kalıcı olarak silinecek.`
            : "Bu işlem geri alınamaz."
        }
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        tone="danger"
      />
    </div>
  );
}
