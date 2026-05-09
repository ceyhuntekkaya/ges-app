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
  Select,
  Switch,
  Table,
  useToast,
} from "@/components/ui";
import type { TableColumn, SelectOption } from "@/components/ui";
import {
  adminCatalogCountriesList,
  adminCatalogUniversitiesCreate,
  adminCatalogUniversitiesDelete,
  adminCatalogUniversitiesList,
  adminCatalogUniversitiesUpdate,
} from "@/lib/api/generated/index";
import type {
  AdminCatalogUniversitiesListParams,
  CountryDto,
  UniversityDto,
  UniversityUpsertRequestDto,
} from "@/lib/api/generated/index";
import { humanizeApiError, humanizeStatus } from "@/lib/api/errors";

const PAGE_SIZE_DEFAULT = 20;

type EditDraft = {
  name: string;
  countryId: string;
  active: boolean;
};

function emptyDraft(): EditDraft {
  return { name: "", countryId: "", active: true };
}

export function UniversitiesPanel() {
  const toast = useToast();

  // List state
  const [items, setItems] = React.useState<UniversityDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [pageIndex, setPageIndex] = React.useState(0); // backend is 0-indexed
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE_DEFAULT);
  const [loading, setLoading] = React.useState(false);

  // Filters
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [countryFilter, setCountryFilter] = React.useState<string | null>(null);

  // Country dropdown options (cached)
  const [countries, setCountries] = React.useState<CountryDto[]>([]);
  const [countriesLoading, setCountriesLoading] = React.useState(false);

  // Inline edit state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState<EditDraft>(emptyDraft());
  const [savingId, setSavingId] = React.useState<string | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createDraft, setCreateDraft] = React.useState<EditDraft>(emptyDraft());
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = React.useState<UniversityDto | null>(null);

  // Debounce search
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
      const params: AdminCatalogUniversitiesListParams = {
        page: pageIndex,
        size: pageSize,
      };
      if (debouncedQ) params.q = debouncedQ;
      if (countryFilter) params.countryId = countryFilter;
      const res = await adminCatalogUniversitiesList(params);
      if (res.status >= 200 && res.status < 300) {
        setItems(res.data.items ?? []);
        setTotal(res.data.totalItems ?? 0);
      } else {
        toast.error({
          title: "Üniversiteler yüklenemedi",
          description: humanizeStatus(res.status),
        });
      }
    } catch (e) {
      toast.error({ title: "Üniversiteler yüklenemedi", description: humanizeApiError(e) });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, debouncedQ, countryFilter, toast]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  // Load all countries (paged through if needed; for now first 200)
  const loadCountries = React.useCallback(async () => {
    setCountriesLoading(true);
    try {
      const res = await adminCatalogCountriesList({ page: 0, size: 200 });
      if (res.status >= 200 && res.status < 300) {
        setCountries(res.data.items ?? []);
      }
    } finally {
      setCountriesLoading(false);
    }
  }, []);

  // Mount-time fetch of country options (external system synchronization).
  React.useEffect(() => {
    void loadCountries();
  }, [loadCountries]);

  const countryOptions = React.useMemo<SelectOption[]>(
    () =>
      countries
        .filter((c): c is CountryDto & { id: string } => !!c.id)
        .map((c) => ({
          value: c.id,
          label: c.name ?? c.code ?? "—",
          description: c.code,
        })),
    [countries],
  );

  function startEdit(row: UniversityDto) {
    setEditingId(row.id ?? null);
    setEditDraft({
      name: row.name ?? "",
      countryId: row.country?.id ?? "",
      active: row.active ?? true,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(emptyDraft());
  }

  async function saveEdit(row: UniversityDto) {
    if (!row.id) return;
    if (!editDraft.name.trim()) {
      toast.warning({ title: "Üniversite adı gerekli" });
      return;
    }
    if (!editDraft.countryId) {
      toast.warning({ title: "Ülke seçimi gerekli" });
      return;
    }
    setSavingId(row.id);
    try {
      const body: UniversityUpsertRequestDto = {
        name: editDraft.name.trim(),
        countryId: editDraft.countryId,
        active: editDraft.active,
      };
      const res = await adminCatalogUniversitiesUpdate(row.id, body);
      if (res.status >= 200 && res.status < 300) {
        toast.success({ title: "Üniversite güncellendi" });
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
      const res = await adminCatalogUniversitiesDelete(deleteTarget.id);
      if (res.status >= 200 && res.status < 300) {
        toast.success({ title: "Üniversite silindi" });
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
      setCreateError("Üniversite adı gerekli.");
      return;
    }
    if (!createDraft.countryId) {
      setCreateError("Ülke seçimi gerekli.");
      return;
    }
    setCreating(true);
    try {
      const body: UniversityUpsertRequestDto = {
        name: createDraft.name.trim(),
        countryId: createDraft.countryId,
        active: createDraft.active,
      };
      const res = await adminCatalogUniversitiesCreate(body);
      if (res.status >= 200 && res.status < 300) {
        toast.success({ title: "Üniversite eklendi" });
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

  const columns: TableColumn<UniversityDto>[] = [
    {
      key: "name",
      header: "Üniversite",
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
              placeholder="Üniversite adı"
            />
          );
        }
        return (
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-50)] text-[var(--accent-700)]">
              <Icon name="school" size={14} />
            </span>
            <span className="truncate font-medium text-[var(--text-primary)]">
              {row.name ?? "—"}
            </span>
          </div>
        );
      },
    },
    {
      key: "country",
      header: "Ülke",
      width: 220,
      sortable: true,
      sortAccessor: (r) => r.country?.name?.toLowerCase() ?? "",
      cell: (row) => {
        const isEditing = editingId === row.id;
        if (isEditing) {
          return (
            <Select
              size="sm"
              searchable
              options={countryOptions}
              value={editDraft.countryId}
              onChange={(v) => setEditDraft((d) => ({ ...d, countryId: v ?? "" }))}
              placeholder="Ülke seçin"
              loading={countriesLoading}
              emptyText="Ülke bulunamadı."
            />
          );
        }
        return row.country ? (
          <div className="flex items-center gap-2">
            <Badge variant="outline" size="sm">
              {row.country.code ?? "—"}
            </Badge>
            <span className="truncate text-[var(--text-secondary)]">{row.country.name ?? "—"}</span>
          </div>
        ) : (
          <span className="text-[var(--text-muted)]">—</span>
        );
      },
    },
    {
      key: "active",
      header: "Durum",
      width: 130,
      align: "left",
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
      <Table<UniversityDto>
        title="Üniversiteler"
        columns={columns}
        data={items}
        rowKey={(r, idx) => r.id ?? `idx-${idx}`}
        loading={loading}
        sortable
        searchable
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Üniversite ara..."
        toolbarActions={
          <>
            <div className="w-44">
              <Select
                size="sm"
                clearable
                searchable
                placeholder="Tüm ülkeler"
                options={countryOptions}
                value={countryFilter}
                onChange={(v) => {
                  setCountryFilter(v);
                  setPageIndex(0);
                }}
                emptyText="Ülke yok"
                loading={countriesLoading}
              />
            </div>
            <Button
              size="sm"
              leftIcon={<Icon name="plus" size={14} />}
              onClick={() => {
                setCreateDraft(emptyDraft());
                setCreateError(null);
                setCreateOpen(true);
              }}
            >
              Yeni Üniversite
            </Button>
          </>
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
        emptyTitle="Henüz üniversite yok"
        emptyDescription="Yeni bir üniversite ekleyerek katalogu doldurmaya başlayın."
        emptyIcon={<Icon name="school" size={20} />}
        emptyAction={
          <Button
            size="sm"
            leftIcon={<Icon name="plus" size={14} />}
            onClick={() => {
              setCreateDraft(emptyDraft());
              setCreateOpen(true);
            }}
          >
            Yeni Üniversite
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
        title="Yeni Üniversite"
        description="Üniversite adı ve bağlı olduğu ülkeyi belirleyin."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>
              Vazgeç
            </Button>
            <Button onClick={handleCreate} loading={creating} leftIcon={<Icon name="plus" size={14} />}>
              Ekle
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Üniversite adı"
            required
            value={createDraft.name}
            onChange={(e) => setCreateDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Örn: Boğaziçi Üniversitesi"
            containerClassName="sm:col-span-2"
            maxLength={255}
          />
          <Select
            label="Ülke"
            required
            searchable
            placeholder="Ülke seçin"
            options={countryOptions}
            value={createDraft.countryId}
            onChange={(v) => setCreateDraft((d) => ({ ...d, countryId: v ?? "" }))}
            loading={countriesLoading}
            emptyText="Ülke bulunamadı."
            containerClassName="sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <Switch
              checked={createDraft.active}
              onChange={(v) => setCreateDraft((d) => ({ ...d, active: v }))}
              label="Aktif olarak ekle"
              description="Pasif kayıtlar listelerde görünmez."
            />
          </div>
          {createError ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--danger-100)] bg-[var(--danger-50)] px-3 py-2 text-xs text-[var(--danger-700)] sm:col-span-2">
              {createError}
            </div>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Üniversite silinsin mi?"
        description={
          deleteTarget?.name
            ? `"${deleteTarget.name}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`
            : "Bu işlem geri alınamaz."
        }
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        tone="danger"
      />
    </div>
  );
}
