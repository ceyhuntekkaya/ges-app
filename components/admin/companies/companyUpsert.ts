import type { CompanyDto, CompanyUpsertRequestDto } from "@/lib/api/generated/index";

export type CompanyUpsertDraft = {
  code: string;
  name: string;
  taxNumber: string;
  contactFullName: string;
  contactPhone: string;
  contactEmail: string;
};

export type DraftFieldErrors = Partial<Record<keyof CompanyUpsertDraft, string>>;

export function emptyCompanyDraft(): CompanyUpsertDraft {
  return {
    code: "",
    name: "",
    taxNumber: "",
    contactFullName: "",
    contactPhone: "",
    contactEmail: "",
  };
}

export function draftFromDto(dto?: CompanyDto | null): CompanyUpsertDraft {
  return {
    code: dto?.code ?? "",
    name: dto?.name ?? "",
    taxNumber: dto?.taxNumber ?? "",
    contactFullName: dto?.contactFullName ?? "",
    contactPhone: dto?.contactPhone ?? "",
    contactEmail: dto?.contactEmail ?? "",
  };
}

function len(v: string) {
  return (v ?? "").trim().length;
}

export function validateCompanyDraft(d: CompanyUpsertDraft): {
  ok: boolean;
  summary: string;
  fieldErrors: DraftFieldErrors;
} {
  const fieldErrors: DraftFieldErrors = {};

  if (!len(d.code)) fieldErrors.code = "Kod zorunludur.";
  else if (len(d.code) > 64) fieldErrors.code = "Kod en fazla 64 karakter olabilir.";

  if (!len(d.name)) fieldErrors.name = "Şirket adı zorunludur.";
  else if (len(d.name) > 255) fieldErrors.name = "Şirket adı en fazla 255 karakter olabilir.";

  if (len(d.taxNumber) > 64) fieldErrors.taxNumber = "Vergi numarası en fazla 64 karakter olabilir.";
  if (len(d.contactFullName) > 128) fieldErrors.contactFullName = "İletişim adı en fazla 128 karakter olabilir.";
  if (len(d.contactPhone) > 32) fieldErrors.contactPhone = "Telefon en fazla 32 karakter olabilir.";
  if (len(d.contactEmail) > 255) fieldErrors.contactEmail = "E-posta en fazla 255 karakter olabilir.";

  const ok = Object.keys(fieldErrors).length === 0;
  return {
    ok,
    summary: ok ? "" : "Lütfen işaretli alanları kontrol edin.",
    fieldErrors,
  };
}

export function payloadFromDraft(d: CompanyUpsertDraft): CompanyUpsertRequestDto {
  return {
    code: (d.code ?? "").trim(),
    name: (d.name ?? "").trim(),
    taxNumber: (d.taxNumber ?? "").trim() || undefined,
    contactFullName: (d.contactFullName ?? "").trim() || undefined,
    contactPhone: (d.contactPhone ?? "").trim() || undefined,
    contactEmail: (d.contactEmail ?? "").trim() || undefined,
  };
}

