"use client";

import type { LanguageCampProjectUpsertDraft } from "./LanguageCampProjectForm";

export type LanguageCampProjectDetailDto = {
  id?: string;
  title?: string;
  companyId?: string;
  quota?: number;
  applicationStartAt?: string;
  applicationEndAt?: string;
  projectStartAt?: string;
  projectEndAt?: string;
  projectStatus?: string;
  projectType?: string;
  banner?: string;
  smallBanner?: string;
  images?: string[];
  presentationVideoUrl?: string;
  presentationDocumentUrl?: string;
  description?: string;
  duration?: string;
  primaryLocations?: string[];
  locations?: string[];
  location?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  included?: string[];
  excluded?: string[];
  highlights?: string[];
  itinerary?: Array<Record<string, unknown>>;
  allowParent?: boolean;
  allowTeacher?: boolean;
  allowManager?: boolean;
  individual?: boolean;
};

export function emptyProjectDraft(): LanguageCampProjectUpsertDraft {
  return {
    title: "",
    individual: true,
    companyId: null,
    projectStatus: "ACTIVE",
    projectType: null,
    quota: "",
    applicationStartAt: "",
    applicationEndAt: "",
    projectStartAt: "",
    projectEndAt: "",
    banner: "",
    smallBanner: "",
    imagesJson: "[]",
    presentationVideoUrl: "",
    presentationDocumentUrl: "",
    description: "",
    duration: "",
    primaryLocationsJson: "[]",
    locationsJson: "[]",
    location: "",
    price: "",
    originalPrice: "",
    currency: "",
    includedJson: "[]",
    excludedJson: "[]",
    highlightsJson: "[]",
    itineraryJson: "[]",
    allowParent: false,
    allowTeacher: false,
    allowManager: false,
  };
}

function normalizeDecimalRaw(raw: string) {
  return (raw ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
}

function isValidMoney(raw: string) {
  const s = normalizeDecimalRaw(raw);
  if (!s) return false;
  // Require at least 2 decimals if a separator is present; allow integers (UI will pad).
  if (s.includes(".")) return /^\d+\.\d{2,}$/.test(s);
  return /^\d+$/.test(s);
}

function parseOptionalInt(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error(`Geçersiz sayı: ${raw}`);
  return Math.trunc(n);
}

function parseOptionalDecimal(raw: string): number | null {
  const s = normalizeDecimalRaw(raw);
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error(`Geçersiz sayı: ${raw}`);
  return n;
}

function parseOptionalIso(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`Geçersiz tarih: ${raw}`);
  return s;
}

function parseJson<T>(raw: string, fallback: T): T {
  const s = raw.trim();
  if (!s) return fallback;
  return JSON.parse(s) as T;
}

function stripHtmlToText(html: string) {
  const s = (html ?? "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

export type DraftFieldErrors = Partial<Record<keyof LanguageCampProjectUpsertDraft, string>>;

export function validateProjectDraft(draft: LanguageCampProjectUpsertDraft): {
  ok: boolean;
  fieldErrors: DraftFieldErrors;
  summary: string | null;
} {
  const fieldErrors: DraftFieldErrors = {};

  if (!draft.title.trim()) fieldErrors.title = "Başlık zorunlu.";

  const quotaRaw = draft.quota.trim();
  const quotaNum = quotaRaw ? Number(quotaRaw) : NaN;
  if (!quotaRaw) fieldErrors.quota = "Kontenjan zorunlu.";
  else if (!Number.isFinite(quotaNum) || !Number.isInteger(quotaNum)) fieldErrors.quota = "Kontenjan tam sayı olmalı.";
  else if (quotaNum < 1) fieldErrors.quota = "Kontenjan en az 1 olmalı.";

  if (!draft.applicationStartAt.trim()) fieldErrors.applicationStartAt = "Başvuru başlangıç tarihi zorunlu.";
  else {
    const d = new Date(draft.applicationStartAt.trim());
    if (Number.isNaN(d.getTime())) fieldErrors.applicationStartAt = "Geçersiz tarih.";
  }

  if (!draft.applicationEndAt.trim()) fieldErrors.applicationEndAt = "Başvuru bitiş tarihi zorunlu.";
  else {
    const d = new Date(draft.applicationEndAt.trim());
    if (Number.isNaN(d.getTime())) fieldErrors.applicationEndAt = "Geçersiz tarih.";
  }

  if (!draft.projectStartAt.trim()) fieldErrors.projectStartAt = "Proje başlangıç tarihi zorunlu.";
  else {
    const d = new Date(draft.projectStartAt.trim());
    if (Number.isNaN(d.getTime())) fieldErrors.projectStartAt = "Geçersiz tarih.";
  }

  if (!draft.projectEndAt.trim()) fieldErrors.projectEndAt = "Proje bitiş tarihi zorunlu.";
  else {
    const d = new Date(draft.projectEndAt.trim());
    if (Number.isNaN(d.getTime())) fieldErrors.projectEndAt = "Geçersiz tarih.";
  }

  const appStart = draft.applicationStartAt.trim() ? new Date(draft.applicationStartAt.trim()).getTime() : NaN;
  const appEnd = draft.applicationEndAt.trim() ? new Date(draft.applicationEndAt.trim()).getTime() : NaN;
  if (Number.isFinite(appStart) && Number.isFinite(appEnd) && appEnd <= appStart) {
    fieldErrors.applicationEndAt = "Başvuru bitiş tarihi, başlangıç tarihinden büyük olmalı.";
  }

  const projStart = draft.projectStartAt.trim() ? new Date(draft.projectStartAt.trim()).getTime() : NaN;
  const projEnd = draft.projectEndAt.trim() ? new Date(draft.projectEndAt.trim()).getTime() : NaN;
  if (Number.isFinite(projStart) && Number.isFinite(projEnd) && projEnd <= projStart) {
    fieldErrors.projectEndAt = "Proje bitiş tarihi, başlangıç tarihinden büyük olmalı.";
  }

  if (Number.isFinite(appEnd) && Number.isFinite(projStart) && projStart <= appEnd) {
    fieldErrors.projectStartAt = "Proje başlangıç tarihi, başvuru bitiş tarihinden büyük olmalı.";
  }

  if (!draft.individual && !draft.companyId) fieldErrors.companyId = "Kurumsal projede şirket zorunlu.";

  if (!draft.projectType) fieldErrors.projectType = "Proje tipi zorunlu.";

  if (!draft.banner.trim()) fieldErrors.banner = "Banner zorunlu.";
  if (!draft.smallBanner.trim()) fieldErrors.smallBanner = "Small banner zorunlu.";

  const descText = stripHtmlToText(draft.description);
  if (!descText) fieldErrors.description = "Açıklama zorunlu.";

  const durationRaw = draft.duration.trim();
  const durationNum = durationRaw ? Number(durationRaw) : NaN;
  if (!durationRaw) fieldErrors.duration = "Gün sayısı zorunlu.";
  else if (!Number.isFinite(durationNum) || !Number.isInteger(durationNum)) fieldErrors.duration = "Gün sayısı tam sayı olmalı.";
  else if (durationNum < 1) fieldErrors.duration = "Gün sayısı en az 1 olmalı.";

  const cur = draft.currency.trim();
  if (!cur) fieldErrors.currency = "Para birimi zorunlu.";
  else if (!["TRY", "USD", "EUR"].includes(cur)) fieldErrors.currency = "Para birimi TRY / USD / EUR olmalı.";

  if (!draft.price.trim()) fieldErrors.price = "Fiyat zorunlu.";
  else if (!isValidMoney(draft.price)) fieldErrors.price = "Fiyat formatı hatalı. Örn: 1999,90";

  if (draft.originalPrice.trim() && !isValidMoney(draft.originalPrice)) {
    fieldErrors.originalPrice = "Eski fiyat formatı hatalı. Örn: 2499,90";
  }

  if (!draft.location.trim()) fieldErrors.location = "Location zorunlu.";

  const ok = Object.keys(fieldErrors).length === 0;
  return {
    ok,
    fieldErrors,
    summary: ok ? null : "Lütfen zorunlu alanları doldurun.",
  };
}

export function draftFromDetail(d: LanguageCampProjectDetailDto): LanguageCampProjectUpsertDraft {
  return {
    title: d.title ?? "",
    individual: d.individual ?? true,
    companyId: d.companyId ?? null,
    projectStatus: (d.projectStatus as LanguageCampProjectUpsertDraft["projectStatus"]) ?? "ACTIVE",
    projectType: (d.projectType as LanguageCampProjectUpsertDraft["projectType"]) ?? null,

    quota: d.quota === null || d.quota === undefined ? "" : String(d.quota),
    applicationStartAt: d.applicationStartAt ?? "",
    applicationEndAt: d.applicationEndAt ?? "",
    projectStartAt: d.projectStartAt ?? "",
    projectEndAt: d.projectEndAt ?? "",

    banner: d.banner ?? "",
    smallBanner: d.smallBanner ?? "",
    imagesJson: JSON.stringify(d.images ?? [], null, 2),
    presentationVideoUrl: d.presentationVideoUrl ?? "",
    presentationDocumentUrl: d.presentationDocumentUrl ?? "",

    description: d.description ?? "",
    duration: d.duration ?? "",
    primaryLocationsJson: JSON.stringify(d.primaryLocations ?? [], null, 2),
    locationsJson: JSON.stringify(d.locations ?? [], null, 2),
    location: d.location ?? "",

    price: d.price === null || d.price === undefined ? "" : String(d.price),
    originalPrice: d.originalPrice === null || d.originalPrice === undefined ? "" : String(d.originalPrice),
    currency: d.currency ?? "",

    includedJson: JSON.stringify(d.included ?? [], null, 2),
    excludedJson: JSON.stringify(d.excluded ?? [], null, 2),
    highlightsJson: JSON.stringify(d.highlights ?? [], null, 2),
    itineraryJson: JSON.stringify(d.itinerary ?? [], null, 2),

    allowParent: d.allowParent ?? false,
    allowTeacher: d.allowTeacher ?? false,
    allowManager: d.allowManager ?? false,
  };
}

export function payloadFromDraft(draft: LanguageCampProjectUpsertDraft) {
  const images = parseJson<string[]>(draft.imagesJson, []).map((x) => (x ?? "").trim()).filter(Boolean);
  const primaryLocations = parseJson<string[]>(draft.primaryLocationsJson, []);
  const locations = parseJson<string[]>(draft.locationsJson, []);
  const included = parseJson<string[]>(draft.includedJson, []);
  const excluded = parseJson<string[]>(draft.excludedJson, []);
  const highlights = parseJson<string[]>(draft.highlightsJson, []);
  const itinerary = parseJson<Array<Record<string, unknown>>>(draft.itineraryJson, []);

  return {
    title: draft.title.trim(),
    individual: draft.individual,
    companyId: draft.companyId ?? null,
    projectStatus: draft.projectStatus ?? null,
    projectType: draft.projectType ?? null,

    quota: parseOptionalInt(draft.quota),
    applicationStartAt: parseOptionalIso(draft.applicationStartAt),
    applicationEndAt: parseOptionalIso(draft.applicationEndAt),
    projectStartAt: parseOptionalIso(draft.projectStartAt),
    projectEndAt: parseOptionalIso(draft.projectEndAt),

    banner: draft.banner.trim() || null,
    smallBanner: draft.smallBanner.trim() || null,
    images,
    presentationVideoUrl: draft.presentationVideoUrl.trim() || null,
    presentationDocumentUrl: draft.presentationDocumentUrl.trim() || null,

    description: draft.description.trim() || null,
    duration: draft.duration.trim() || null,
    primaryLocations,
    locations,
    location: draft.location.trim() || null,

    price: parseOptionalDecimal(draft.price),
    originalPrice: parseOptionalDecimal(draft.originalPrice),
    currency: draft.currency.trim() || null,

    included,
    excluded,
    highlights,
    itinerary,

    allowParent: draft.allowParent,
    allowTeacher: draft.allowTeacher,
    allowManager: draft.allowManager,
  };
}

