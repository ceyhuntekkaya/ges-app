"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, PageHeader, Skeleton, useToast } from "@/components/ui";
import type { SelectOption } from "@/components/ui";
import { adminCompaniesList } from "@/lib/api/generated/index";
import type { CompanyDto } from "@/lib/api/generated/index";
import { humanizeApiError, humanizeStatus } from "@/lib/api/errors";
import { LanguageCampProjectForm } from "./LanguageCampProjectForm";
import {
  draftFromDetail,
  payloadFromDraft,
  validateProjectDraft,
  type DraftFieldErrors,
  type LanguageCampProjectDetailDto,
} from "./projectUpsert";

async function fetchProject(id: string) {
  if (!id || id === "undefined") {
    throw new Error("Geçersiz proje ID.");
  }
  const res = await fetch(`/api/proxy/v1/admin/language-camp-projects/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return (await res.json()) as LanguageCampProjectDetailDto;
}

async function updateProject(id: string, body: Record<string, unknown>) {
  if (!id || id === "undefined") {
    throw new Error("Geçersiz proje ID.");
  }
  const res = await fetch(`/api/proxy/v1/admin/language-camp-projects/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return (await res.json()) as { id?: string };
}

export function AdminLanguageCampProjectEditClient({ id }: { id: string }) {
  const toast = useToast();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<DraftFieldErrors>({});
  const [title, setTitle] = React.useState<string>("Proje");

  const [draft, setDraft] = React.useState(() => draftFromDetail({ id }));

  const [companies, setCompanies] = React.useState<CompanyDto[]>([]);
  const [companiesLoading, setCompaniesLoading] = React.useState(false);

  const companyOptions = React.useMemo<SelectOption[]>(
    () =>
      companies
        .filter((c): c is CompanyDto & { id: string } => !!c.id)
        .map((c) => ({ value: c.id, label: c.name ?? c.id, description: c.taxNumber ?? undefined })),
    [companies],
  );

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchProject(id);
        if (cancelled) return;
        setTitle(res.title ?? "Proje");
        setDraft(draftFromDetail(res));
      } catch (e) {
        if (!cancelled) setError(humanizeApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      setCompaniesLoading(true);
      try {
        const res = await adminCompaniesList({ page: 0, size: 200 });
        if (cancelled) return;
        if (res.status >= 200 && res.status < 300) setCompanies(res.data.items ?? []);
        else toast.warning({ title: "Şirket listesi alınamadı", description: humanizeStatus(res.status) });
      } catch (e) {
        if (!cancelled) toast.warning({ title: "Şirket listesi alınamadı", description: humanizeApiError(e) });
      } finally {
        if (!cancelled) setCompaniesLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  async function save() {
    setFormError(null);
    const v = validateProjectDraft(draft);
    setFieldErrors(v.fieldErrors);
    if (!v.ok) {
      setFormError(v.summary);
      return;
    }

    setSaving(true);
    try {
      const payload = payloadFromDraft(draft);
      await updateProject(id, payload);
      toast.success({ title: "Proje güncellendi" });
      router.refresh();
    } catch (e) {
      setFormError(humanizeApiError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Dil Kampı Projeleri"
        title={loading ? "Yükleniyor…" : title}
        description="Proje bilgilerini güncelleyin."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push("/admin/language-camp-projects")}>
              Listeye dön
            </Button>
            <Button onClick={() => void save()} loading={saving} disabled={loading || !!error}>
              Kaydet
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-xs)]">
          <div className="text-sm font-medium text-[var(--danger-600)]">Yüklenemedi</div>
          <div className="mt-1 text-sm text-[var(--text-secondary)]">{error}</div>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => router.refresh()} leftIcon={<Icon name="arrow-up-down" size={16} />}>
              Tekrar dene
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-xs)]">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <LanguageCampProjectForm
              value={draft}
              onChange={setDraft}
              companyOptions={companyOptions}
              companyLoading={companiesLoading}
              error={formError}
              fieldErrors={fieldErrors}
            />
          )}
        </div>
      )}
    </div>
  );
}

