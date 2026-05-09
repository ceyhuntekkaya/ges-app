"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, PageHeader, useToast } from "@/components/ui";
import type { SelectOption } from "@/components/ui";
import { adminCompaniesList } from "@/lib/api/generated/index";
import type { CompanyDto } from "@/lib/api/generated/index";
import { humanizeApiError, humanizeStatus } from "@/lib/api/errors";
import { LanguageCampProjectForm } from "./LanguageCampProjectForm";
import { emptyProjectDraft, payloadFromDraft, validateProjectDraft, type DraftFieldErrors } from "./projectUpsert";

async function createProject(body: Record<string, unknown>) {
  const res = await fetch(`/api/proxy/v1/admin/language-camp-projects`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return (await res.json()) as { id?: string | null };
}

export function AdminLanguageCampProjectCreateClient() {
  const toast = useToast();
  const router = useRouter();

  const [draft, setDraft] = React.useState(emptyProjectDraft());
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<DraftFieldErrors>({});

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
      const created = await createProject(payload);
      toast.success({ title: "Proje eklendi" });
      const id = (created as { id?: unknown })?.id;
      if (typeof id === "string" && id.trim()) {
        router.replace(`/admin/language-camp-projects/${encodeURIComponent(id)}`);
        return;
      }
      // If backend didn't return an id, stay on list and surface a clear error.
      router.replace("/admin/language-camp-projects");
      toast.warning({ title: "Proje eklendi ama ID dönmedi", description: "Listeye yönlendirildiniz. Lütfen projeyi listeden açın." });
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
        title="Yeni Proje"
        description="Yeni bir dil kampı projesi oluşturun."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              leftIcon={<Icon name="chevron-left" size={16} />}
            >
              Geri
            </Button>
            <Button onClick={() => void save()} loading={saving}>
              Kaydet
            </Button>
          </div>
        }
      />

      <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-xs)]">
        <LanguageCampProjectForm
          value={draft}
          onChange={setDraft}
          companyOptions={companyOptions}
          companyLoading={companiesLoading}
          error={formError}
          fieldErrors={fieldErrors}
        />
      </div>
    </div>
  );
}

