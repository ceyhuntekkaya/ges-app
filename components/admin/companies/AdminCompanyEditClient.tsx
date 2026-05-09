"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, PageHeader, Skeleton, useToast } from "@/components/ui";
import { adminCompaniesGet, adminCompaniesUpdate } from "@/lib/api/generated/index";
import { humanizeApiError, humanizeStatus } from "@/lib/api/errors";
import { CompanyForm } from "./CompanyForm";
import {
  draftFromDto,
  payloadFromDraft,
  validateCompanyDraft,
  type DraftFieldErrors,
  type CompanyUpsertDraft,
} from "./companyUpsert";

export function AdminCompanyEditClient({ id }: { id: string }) {
  const toast = useToast();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<DraftFieldErrors>({});
  const [title, setTitle] = React.useState<string>("Şirket");

  const [draft, setDraft] = React.useState<CompanyUpsertDraft>(() => draftFromDto(null));

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        if (!id || id === "undefined") throw new Error("Geçersiz şirket ID.");
        const res = await adminCompaniesGet(id, { cache: "no-store" });
        if (cancelled) return;
        if (res.status < 200 || res.status >= 300) throw new Error(humanizeStatus(res.status));
        setTitle(res.data.name ?? res.data.code ?? "Şirket");
        setDraft(draftFromDto(res.data));
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
      const res = await adminCompaniesUpdate(id, payload);
      if (res.status < 200 || res.status >= 300) throw new Error(humanizeStatus(res.status));
      toast.success({ title: "Şirket güncellendi" });
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
        eyebrow="Şirketler"
        title={loading ? "Yükleniyor…" : title}
        description="Şirket bilgilerini güncelleyin."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push("/admin/companies")}>
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
            <Button
              variant="secondary"
              onClick={() => router.refresh()}
              leftIcon={<Icon name="arrow-up-down" size={16} />}
            >
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
            <CompanyForm value={draft} onChange={setDraft} error={formError} fieldErrors={fieldErrors} />
          )}
        </div>
      )}
    </div>
  );
}

