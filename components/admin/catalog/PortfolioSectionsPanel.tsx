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
  Textarea,
  useToast,
} from "@/components/ui";
import type { TableColumn, SelectOption } from "@/components/ui";
import type { PortfolioSectionDto } from "@/lib/api/generated/index";
import {
  catalogPortfolioSectionsCreate,
  catalogPortfolioSectionsDelete,
  catalogPortfolioSectionsList,
  catalogPortfolioSectionsUpdate,
  type PortfolioSectionUpsertRequest,
} from "@/lib/api/catalogPortfolioSections";
import { humanizeApiError, humanizeStatus } from "@/lib/api/errors";

const PAGE_SIZE_DEFAULT = 50;

type EducationLevel = NonNullable<PortfolioSectionDto["educationLevel"]>;

const ALL_EDUCATION_LEVELS = "__ALL__" as const;
type EducationLevelSelectValue = EducationLevel | typeof ALL_EDUCATION_LEVELS;

type EditDraft = {
  name: string;
  description: string;
  educationLevel: EducationLevel | null;
  departmentKeyword: string;
  sortOrder: number;
  defaultRequired: boolean;
  active: boolean;
};

const EDUCATION_OPTIONS: SelectOption<EducationLevelSelectValue>[] = [
  { value: ALL_EDUCATION_LEVELS, label: "Tüm seviyeler" },
  { value: "BACHELOR", label: "Lisans" },
  { value: "MASTER", label: "Yüksek lisans" },
  { value: "PHD", label: "Doktora" },
];

function toSelectEducationLevel(level: EducationLevel | null): EducationLevelSelectValue {
  return level ?? ALL_EDUCATION_LEVELS;
}

function fromSelectEducationLevel(value: EducationLevelSelectValue | null): EducationLevel | null {
  return value == null || value === ALL_EDUCATION_LEVELS ? null : value;
}

function emptyDraft(): EditDraft {
  return {
    name: "",
    description: "",
    educationLevel: null,
    departmentKeyword: "",
    sortOrder: 0,
    defaultRequired: false,
    active: true,
  };
}

function educationLabel(level?: EducationLevel | null) {
  const opt = EDUCATION_OPTIONS.find((o) => o.value === toSelectEducationLevel(level ?? null));
  return opt?.label ?? "Tüm seviyeler";
}

function toBody(draft: EditDraft): PortfolioSectionUpsertRequest {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    educationLevel: draft.educationLevel,
    departmentKeyword: draft.departmentKeyword.trim() || null,
    sortOrder: draft.sortOrder,
    defaultRequired: draft.defaultRequired,
    active: draft.active,
  };
}

export function PortfolioSectionsPanel() {
  const toast = useToast();

  const [items, setItems] = React.useState<PortfolioSectionDto[]>([]);
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

  const [deleteTarget, setDeleteTarget] = React.useState<PortfolioSectionDto | null>(null);

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
      const res = await catalogPortfolioSectionsList({
        page: pageIndex,
        size: pageSize,
        q: debouncedQ || undefined,
      });
      if (res.status >= 200 && res.status < 300) {
        setItems(res.data.items ?? []);
        setTotal(res.data.totalItems ?? 0);
      } else {
        toast.error({ title: "Şablonlar yüklenemedi", description: humanizeStatus(res.status) });
      }
    } catch (e) {
      toast.error({ title: "Şablonlar yüklenemedi", description: humanizeApiError(e) });
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, debouncedQ, toast]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  function draftFromRow(row: PortfolioSectionDto): EditDraft {
    return {
      name: row.name ?? "",
      description: row.description ?? "",
      educationLevel: (row.educationLevel as EducationLevel | undefined) ?? null,
      departmentKeyword: row.departmentKeyword ?? "",
      sortOrder: row.sortOrder ?? 0,
      defaultRequired: !!row.defaultRequired,
      active: row.active ?? true,
    };
  }

  function startEdit(row: PortfolioSectionDto) {
    setEditingId(row.id ?? null);
    setEditDraft(draftFromRow(row));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(emptyDraft());
  }

  async function saveEdit(row: PortfolioSectionDto) {
    if (!row.id || !editDraft.name.trim()) {
      toast.warning({ title: "Bölüm adı gerekli" });
      return;
    }
    setSavingId(row.id);
    try {
      const res = await catalogPortfolioSectionsUpdate(row.id, toBody(editDraft));
      if (res.status >= 200 && res.status < 300) {
        toast.success({ title: "Şablon güncellendi" });
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
      const res = await catalogPortfolioSectionsDelete(deleteTarget.id);
      if (res.status >= 200 && res.status < 300) {
        toast.success({ title: "Şablon silindi" });
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
      const res = await catalogPortfolioSectionsCreate(toBody(createDraft));
      if (res.status >= 200 && res.status < 300) {
        toast.success({ title: "Şablon eklendi" });
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

  const columns: TableColumn<PortfolioSectionDto>[] = [
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
          <div className="min-w-0">
            <div className="truncate font-medium text-[var(--text-primary)]">{row.name ?? "—"}</div>
            {row.description ? (
              <div className="mt-0.5 line-clamp-2 text-xs text-[var(--text-tertiary)]">{row.description}</div>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "educationLevel",
      header: "Seviye",
      width: 130,
      hideOnMobile: true,
      cell: (row) => {
        if (editingId === row.id) {
          return (
            <Select<EducationLevelSelectValue>
              size="sm"
              value={toSelectEducationLevel(editDraft.educationLevel)}
              onChange={(v) =>
                setEditDraft((d) => ({ ...d, educationLevel: fromSelectEducationLevel(v) }))
              }
              options={EDUCATION_OPTIONS}
            />
          );
        }
        return <span className="text-sm text-[var(--text-secondary)]">{educationLabel(row.educationLevel)}</span>;
      },
    },
    {
      key: "departmentKeyword",
      header: "Bölüm anahtarı",
      width: 140,
      hideOnMobile: true,
      cell: (row) => {
        if (editingId === row.id) {
          return (
            <Input
              inputSize="sm"
              value={editDraft.departmentKeyword}
              onChange={(e) => setEditDraft((d) => ({ ...d, departmentKeyword: e.target.value }))}
              placeholder="örn. mimar"
            />
          );
        }
        return <span className="text-sm text-[var(--text-secondary)]">{row.departmentKeyword ?? "—"}</span>;
      },
    },
    {
      key: "sortOrder",
      header: "Sıra",
      width: 80,
      hideOnMobile: true,
      cell: (row) => {
        if (editingId === row.id) {
          return (
            <Input
              inputSize="sm"
              inputMode="numeric"
              value={String(editDraft.sortOrder)}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, ""));
                setEditDraft((d) => ({ ...d, sortOrder: Number.isFinite(n) ? n : 0 }));
              }}
            />
          );
        }
        return <span className="tabular-nums text-sm text-[var(--text-secondary)]">{row.sortOrder ?? 0}</span>;
      },
    },
    {
      key: "defaultRequired",
      header: "Zorunlu",
      width: 100,
      cell: (row) => {
        if (editingId === row.id) {
          return (
            <Switch
              size="sm"
              checked={editDraft.defaultRequired}
              onChange={(v) => setEditDraft((d) => ({ ...d, defaultRequired: v }))}
              label="Zorunlu"
            />
          );
        }
        return (
          <Badge variant={row.defaultRequired ? "danger" : "neutral"} dot>
            {row.defaultRequired ? "Evet" : "Hayır"}
          </Badge>
        );
      },
    },
    {
      key: "active",
      header: "Aktif",
      width: 90,
      hideOnMobile: true,
      cell: (row) => {
        if (editingId === row.id) {
          return (
            <Switch
              size="sm"
              checked={editDraft.active}
              onChange={(v) => setEditDraft((d) => ({ ...d, active: v }))}
              label="Aktif"
            />
          );
        }
        return (
          <Badge variant={row.active ? "success" : "neutral"} dot>
            {row.active ? "Aktif" : "Pasif"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "",
      width: 120,
      cell: (row) => {
        const isEditing = editingId === row.id;
        if (isEditing) {
          return (
            <div className="flex items-center gap-1">
              <IconButton
                aria-label="Kaydet"
                size="sm"
                variant="primary"
                loading={savingId === row.id}
                icon={<Icon name="check" size={14} strokeWidth={2.4} />}
                onClick={() => void saveEdit(row)}
              />
              <IconButton
                aria-label="Vazgeç"
                size="sm"
                variant="ghost"
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
              size="sm"
              variant="ghost"
              icon={<Icon name="edit" size={14} />}
              onClick={() => startEdit(row)}
            />
            <IconButton
              aria-label="Sil"
              size="sm"
              variant="danger"
              icon={<Icon name="trash" size={14} />}
              onClick={() => setDeleteTarget(row)}
            />
          </div>
        );
      },
    },
  ];

  function DraftForm({
    draft,
    setDraft,
  }: {
    draft: EditDraft;
    setDraft: React.Dispatch<React.SetStateAction<EditDraft>>;
  }) {
    return (
      <div className="grid gap-3">
        <Input
          label="Bölüm adı"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="Örn: Proje Çalışmaları"
        />
        <Textarea
          label="Açıklama"
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          rows={3}
        />
        <Select<EducationLevelSelectValue>
          label="Eğitim seviyesi"
          value={toSelectEducationLevel(draft.educationLevel)}
          onChange={(v) => setDraft((d) => ({ ...d, educationLevel: fromSelectEducationLevel(v) }))}
          options={EDUCATION_OPTIONS}
        />
        <Input
          label="Bölüm anahtar kelimesi"
          value={draft.departmentKeyword}
          onChange={(e) => setDraft((d) => ({ ...d, departmentKeyword: e.target.value }))}
          placeholder="Bölüm tercihinde aranacak kelime (örn. mimar)"
          hint="Boş bırakılırsa tüm bölüm tercihlerine uygulanır."
        />
        <Input
          label="Sıra"
          inputMode="numeric"
          value={String(draft.sortOrder)}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/\D/g, ""));
            setDraft((d) => ({ ...d, sortOrder: Number.isFinite(n) ? n : 0 }));
          }}
        />
        <Switch
          checked={draft.defaultRequired}
          onChange={(v) => setDraft((d) => ({ ...d, defaultRequired: v }))}
          label="Başvuruda varsayılan olarak zorunlu"
        />
        <Switch
          checked={draft.active}
          onChange={(v) => setDraft((d) => ({ ...d, active: v }))}
          label="Aktif şablon"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-secondary)]">
        Başvuru oluşturulduğunda veya bölüm tercihi güncellendiğinde eşleşen şablonlar otomatik eklenir.
      </p>
      <Table<PortfolioSectionDto>
        title="Ek Materyal Şablonları"
        searchable
        searchValue={q}
        searchPlaceholder="Şablon ara…"
        onSearchChange={setQ}
        toolbarActions={
          <Button variant="primary" leftIcon={<Icon name="plus" size={16} />} onClick={() => setCreateOpen(true)}>
            Yeni şablon
          </Button>
        }
        loading={loading}
        data={items}
        rowKey={(row) => row.id ?? crypto.randomUUID()}
        columns={columns}
        pagination={{
          page: pageIndex,
          pageSize,
          total,
          onPageChange: setPageIndex,
          onPageSizeChange: (s) => {
            setPageSize(s);
            setPageIndex(0);
          },
          pageSizeOptions: [25, 50, 100],
        }}
        emptyTitle="Şablon yok"
        emptyDescription="Yeni bir ek materyal şablonu ekleyerek başlayın."
        emptyIcon={<Icon name="book" size={18} />}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Yeni Ek Materyal Şablonu"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>
              Vazgeç
            </Button>
            <Button onClick={() => void handleCreate()} loading={creating}>
              Kaydet
            </Button>
          </>
        }
      >
        {createError ? <div className="mb-3 text-sm text-[var(--danger-600)]">{createError}</div> : null}
        <DraftForm draft={createDraft} setDraft={setCreateDraft} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Şablonu sil"
        description={`"${deleteTarget?.name ?? ""}" şablonunu silmek istediğinize emin misiniz?`}
        confirmLabel="Sil"
        tone="danger"
      />
    </div>
  );
}
