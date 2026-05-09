"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, PageHeader, useToast } from "@/components/ui";
import { adminCompaniesCreate } from "@/lib/api/generated/index";
import { humanizeApiError, humanizeStatus } from "@/lib/api/errors";
import { CompanyForm } from "./CompanyForm";
import { emptyCompanyDraft, payloadFromDraft, validateCompanyDraft, type DraftFieldErrors } from "./companyUpsert";

export function AdminCompanyCreateClient() {
  const toast = useToast();
  const router = useRouter();

  const [draft, setDraft] = React.useState(emptyCompanyDraft());
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<DraftFieldErrors>({});

  async function save() {
    setFormError(null);
    const v = validateCompanyDraft(draft);
    setFieldErrors(v.fieldErrors);
    if (!v.ok) {
      setFormError(v.summary);
      return;
    }

    setSaving(true);
    try {
      const payload = payloadFromDraft(draft);
      const res = await adminCompaniesCreate(payload);
      if (res.status < 200 || res.status >= 300) {
        throw new Error(humanizeStatus(res.status));
      }
      toast.success({ title: "Şirket eklendi" });
      const id = (res.data as { id?: unknown })?.id;
      if (typeof id === "string" && id.trim()) {
        router.replace(`/admin/companies/${encodeURIComponent(id)}`);
      } else {
        router.replace("/admin/companies");
        toast.warning({
          title: "Şirket eklendi ama ID dönmedi",
          description: "Listeye yönlendirildiniz. Lütfen şirketi listeden açın.",
        });
      }
    } catch (e) {
      setFormError(humanizeApiError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Şirketler"
        title="Yeni Şirket"
        description="Yeni bir şirket ekleyin."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.back()} leftIcon={<Icon name="chevron-left" size={16} />}>
              Geri
            </Button>
            <Button onClick={() => void save()} loading={saving}>
              Kaydet
            </Button>
          </div>
        }
      />

      <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-xs)]">
        <CompanyForm value={draft} onChange={setDraft} error={formError} fieldErrors={fieldErrors} />
      </div>
    </div>
  );
}

