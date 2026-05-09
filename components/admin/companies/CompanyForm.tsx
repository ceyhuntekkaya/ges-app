"use client";

import * as React from "react";
import { Input } from "@/components/ui";
import type { DraftFieldErrors, CompanyUpsertDraft } from "./companyUpsert";

export function CompanyForm({
  value,
  onChange,
  error,
  fieldErrors,
}: {
  value: CompanyUpsertDraft;
  onChange: (next: CompanyUpsertDraft) => void;
  error?: string | null;
  fieldErrors?: DraftFieldErrors;
}) {
  const fe = fieldErrors ?? {};

  function set<K extends keyof CompanyUpsertDraft>(key: K, nextValue: CompanyUpsertDraft[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--danger-200)] bg-[var(--danger-50)] p-3 text-sm text-[var(--danger-700)]">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input
          label="Kod"
          required
          value={value.code}
          error={fe.code}
          onChange={(e) => set("code", e.target.value)}
          placeholder="Örn. ACME"
        />
        <Input
          label="Şirket Adı"
          required
          value={value.name}
          error={fe.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Örn. ACME Turizm A.Ş."
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Input
          label="Vergi No"
          value={value.taxNumber}
          error={fe.taxNumber}
          onChange={(e) => set("taxNumber", e.target.value)}
        />
        <Input
          label="İletişim Adı"
          value={value.contactFullName}
          error={fe.contactFullName}
          onChange={(e) => set("contactFullName", e.target.value)}
        />
        <Input
          label="Telefon"
          value={value.contactPhone}
          error={fe.contactPhone}
          onChange={(e) => set("contactPhone", e.target.value)}
        />
      </div>

      <Input
        label="E-posta"
        value={value.contactEmail}
        error={fe.contactEmail}
        onChange={(e) => set("contactEmail", e.target.value)}
        placeholder="ornek@firma.com"
      />
    </div>
  );
}

