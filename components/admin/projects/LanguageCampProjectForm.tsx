"use client";

import * as React from "react";
import { Button, FileUploadInput, HtmlEditor, Icon, Input, Select, Switch, Textarea } from "@/components/ui";
import type { SelectOption } from "@/components/ui";
import type { DraftFieldErrors } from "./projectUpsert";

export type EProjectStatus = "ACTIVE" | "INACTIVE" | "DELETED";
export type EProjectType =
  | "INTERNATIONAL_TRIP"
  | "LOCAL_TRIP"
  | "INTERNATIONAL_SUMMER_SCHOOL"
  | "INTERNATIONAL_EDUCATION"
  | "INTERNATIONAL_HIGH_SCHOOL"
  | "INTERNATIONAL_UNIVERSITY"
  | "INTERNATIONAL_TRAVEL_INSURANCE";

export type LanguageCampProjectUpsertDraft = {
  title: string;
  individual: boolean;
  companyId: string | null;
  projectStatus: EProjectStatus | null;
  projectType: EProjectType | null;

  quota: string;
  applicationStartAt: string;
  applicationEndAt: string;
  projectStartAt: string;
  projectEndAt: string;

  banner: string;
  smallBanner: string;
  imagesJson: string;
  presentationVideoUrl: string;
  presentationDocumentUrl: string;

  description: string;
  duration: string;
  primaryLocationsJson: string;
  locationsJson: string;
  location: string;

  price: string;
  originalPrice: string;
  currency: string;

  includedJson: string;
  excludedJson: string;
  highlightsJson: string;
  itineraryJson: string;

  allowParent: boolean;
  allowTeacher: boolean;
  allowManager: boolean;
};

const STATUS_OPTIONS: SelectOption[] = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "INACTIVE", label: "Pasif" },
  { value: "DELETED", label: "Silinmiş" },
];

const TYPE_OPTIONS: SelectOption[] = [
  { value: "INTERNATIONAL_TRIP", label: "International Trip" },
  { value: "LOCAL_TRIP", label: "Local Trip" },
  { value: "INTERNATIONAL_SUMMER_SCHOOL", label: "International Summer School" },
  { value: "INTERNATIONAL_EDUCATION", label: "International Education" },
  { value: "INTERNATIONAL_HIGH_SCHOOL", label: "International High School" },
  { value: "INTERNATIONAL_UNIVERSITY", label: "International University" },
  { value: "INTERNATIONAL_TRAVEL_INSURANCE", label: "International Travel Insurance" },
];

const CURRENCY_OPTIONS: SelectOption<"TRY" | "USD" | "EUR">[] = [
  { value: "TRY", label: "TRY" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
];

function digitsOnly(raw: string) {
  return (raw ?? "").replace(/[^\d]/g, "");
}

function isoToDateValue(iso: string) {
  const s = (iso ?? "").trim();
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateValueToIso(dateValue: string) {
  const s = (dateValue ?? "").trim();
  if (!s) return "";
  const [y, m, d] = s.split("-").map((x) => Number(x));
  if (!y || !m || !d) return "";
  // Store midnight UTC ISO string (backend expects Instant).
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)).toISOString();
}

function formatDateTR(iso: string) {
  const s = (iso ?? "").trim();
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

function normalizeMoneyInput(raw: string) {
  // Allow digits + one separator (comma/dot). We keep comma for display.
  const s = (raw ?? "").replace(/\s+/g, "");
  const cleaned = s.replace(/[^\d.,]/g, "");
  const firstSepIdx = Math.max(cleaned.indexOf(","), cleaned.indexOf("."));
  if (firstSepIdx === -1) return cleaned;
  const head = cleaned.slice(0, firstSepIdx).replace(/[.,]/g, "");
  const tail = cleaned.slice(firstSepIdx + 1).replace(/[.,]/g, "");
  return `${head},${tail}`;
}

function padMoneyTwoDecimals(raw: string) {
  const s = normalizeMoneyInput(raw);
  if (!s) return "";
  if (!s.includes(",")) return `${s},00`;
  const [a, bRaw] = s.split(",");
  const b = (bRaw ?? "").padEnd(2, "0");
  return `${a || "0"},${b}`;
}

function linesToArrayJson(lines: string) {
  const items = (lines ?? "")
    .split(/\r?\n/g)
    .map((x) => x.trim())
    .filter(Boolean);
  return JSON.stringify(items, null, 2);
}

function arrayJsonToLines(jsonRaw: string) {
  const s = (jsonRaw ?? "").trim();
  if (!s) return "";
  try {
    const arr = JSON.parse(s) as unknown;
    if (!Array.isArray(arr)) return "";
    return arr.map((x) => String(x ?? "").trim()).filter(Boolean).join("\n");
  } catch {
    return "";
  }
}

function linesToItineraryJson(lines: string) {
  const items = (lines ?? "")
    .split(/\r?\n/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((title) => ({ title }));
  return JSON.stringify(items, null, 2);
}

function itineraryJsonToLines(jsonRaw: string) {
  const s = (jsonRaw ?? "").trim();
  if (!s) return "";
  try {
    const arr = JSON.parse(s) as unknown;
    if (!Array.isArray(arr)) return "";
    return arr
      .map((x) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object" && "title" in (x as Record<string, unknown>)) return String((x as { title?: unknown }).title ?? "");
        return "";
      })
      .map((x) => x.trim())
      .filter(Boolean)
      .join("\n");
  } catch {
    return "";
  }
}

function parseJsonStringArrayLoose(raw: string) {
  const s = (raw ?? "").trim();
  if (!s) return [];
  try {
    const arr = JSON.parse(s) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => String(x ?? ""));
  } catch {
    return [];
  }
}

function jsonStringifyArray(arr: string[]) {
  return JSON.stringify(arr, null, 2);
}

function useJsonLinesField(params: {
  json: string;
  toLines: (json: string) => string;
  toJson: (lines: string) => string;
}) {
  const [lines, setLines] = React.useState(() => params.toLines(params.json));

  React.useEffect(() => {
    setLines(params.toLines(params.json));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.json]);

  return { lines, setLines, toJson: params.toJson };
}

export function LanguageCampProjectForm({
  value,
  onChange,
  companyOptions,
  companyLoading,
  error,
  fieldErrors,
}: {
  value: LanguageCampProjectUpsertDraft;
  onChange: (next: LanguageCampProjectUpsertDraft) => void;
  companyOptions: SelectOption[];
  companyLoading?: boolean;
  error?: string | null;
  fieldErrors?: DraftFieldErrors;
}) {
  const set = React.useCallback(
    <K extends keyof LanguageCampProjectUpsertDraft>(key: K, next: LanguageCampProjectUpsertDraft[K]) => {
      onChange({ ...value, [key]: next });
    },
    [onChange, value],
  );

  const effectiveErrors = fieldErrors ?? {};

  const images = React.useMemo(() => parseJsonStringArrayLoose(value.imagesJson), [value.imagesJson]);
  const imagesLinesHint = "Galeri için birden fazla resim ekleyebilirsiniz (sadece resim).";

  const primaryLocations = useJsonLinesField({
    json: value.primaryLocationsJson,
    toLines: arrayJsonToLines,
    toJson: linesToArrayJson,
  });
  const locations = useJsonLinesField({
    json: value.locationsJson,
    toLines: arrayJsonToLines,
    toJson: linesToArrayJson,
  });
  const included = useJsonLinesField({
    json: value.includedJson,
    toLines: arrayJsonToLines,
    toJson: linesToArrayJson,
  });
  const excluded = useJsonLinesField({
    json: value.excludedJson,
    toLines: arrayJsonToLines,
    toJson: linesToArrayJson,
  });
  const highlights = useJsonLinesField({
    json: value.highlightsJson,
    toLines: arrayJsonToLines,
    toJson: linesToArrayJson,
  });
  const itinerary = useJsonLinesField({
    json: value.itineraryJson,
    toLines: itineraryJsonToLines,
    toJson: linesToItineraryJson,
  });

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--danger-200)] bg-[var(--danger-50)] px-3 py-2 text-sm text-[var(--danger-700)]">
          <div className="flex items-start gap-2">
            <Icon name="warning" size={16} className="mt-0.5 text-[var(--danger-600)]" />
            <div className="min-w-0">
              <div className="font-medium">Eksik / hatalı alanlar var</div>
              <div className="mt-0.5 text-[var(--danger-700)]">{error}</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Input
          inputSize="md"
          label="Başlık"
          required
          value={value.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Proje adı"
          error={effectiveErrors.title}
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-[var(--text-primary)]">Bireysel proje</div>
          <div className="text-xs text-[var(--text-tertiary)]">
            Bireysel ise şirket seçimi gösterilmez. Kurumsalda şirket zorunludur.
          </div>
        </div>
        <Switch
          checked={value.individual}
          onChange={(v) => {
            onChange({ ...value, individual: v, companyId: v ? null : value.companyId });
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select<EProjectStatus>
          placeholder="Seçiniz"
          clearable
          value={value.projectStatus}
          onChange={(v) => set("projectStatus", v)}
          options={STATUS_OPTIONS as unknown as { value: EProjectStatus; label: string }[]}
          label="Durum"
        />

        <Select<EProjectType>
          placeholder="Seçiniz"
          clearable
          value={value.projectType}
          onChange={(v) => set("projectType", v)}
          options={TYPE_OPTIONS as unknown as { value: EProjectType; label: string }[]}
          label="Proje tipi"
          required
          error={effectiveErrors.projectType}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Kontenjan"
          inputSize="md"
          inputMode="numeric"
          type="text"
          required
          value={value.quota}
          onChange={(e) => set("quota", digitsOnly(e.target.value))}
          placeholder="En az 1"
          hint="Sadece tam sayı."
          error={effectiveErrors.quota}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Başvuru başlangıç tarihi"
          inputSize="md"
          type="date"
          lang="tr-TR"
          required
          value={isoToDateValue(value.applicationStartAt)}
          onChange={(e) => set("applicationStartAt", dateValueToIso(e.target.value))}
          hint={value.applicationStartAt ? `Seçilen: ${formatDateTR(value.applicationStartAt)}` : "gg.aa.yyyy"}
          error={effectiveErrors.applicationStartAt}
        />
        <Input
          label="Başvuru bitiş tarihi"
          inputSize="md"
          type="date"
          lang="tr-TR"
          required
          value={isoToDateValue(value.applicationEndAt)}
          min={isoToDateValue(value.applicationStartAt) || undefined}
          onChange={(e) => set("applicationEndAt", dateValueToIso(e.target.value))}
          hint={value.applicationEndAt ? `Seçilen: ${formatDateTR(value.applicationEndAt)}` : "gg.aa.yyyy"}
          error={effectiveErrors.applicationEndAt}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Proje başlangıç tarihi"
          inputSize="md"
          type="date"
          lang="tr-TR"
          required
          value={isoToDateValue(value.projectStartAt)}
          min={isoToDateValue(value.applicationEndAt) || undefined}
          onChange={(e) => set("projectStartAt", dateValueToIso(e.target.value))}
          hint={value.projectStartAt ? `Seçilen: ${formatDateTR(value.projectStartAt)}` : "gg.aa.yyyy"}
          error={effectiveErrors.projectStartAt}
        />
        <Input
          label="Proje bitiş tarihi"
          inputSize="md"
          type="date"
          lang="tr-TR"
          required
          value={isoToDateValue(value.projectEndAt)}
          min={isoToDateValue(value.projectStartAt) || undefined}
          onChange={(e) => set("projectEndAt", dateValueToIso(e.target.value))}
          hint={value.projectEndAt ? `Seçilen: ${formatDateTR(value.projectEndAt)}` : "gg.aa.yyyy"}
          error={effectiveErrors.projectEndAt}
        />
      </div>

      {!value.individual ? (
        <div className="space-y-1.5">
          <Select<string>
            label="Şirket"
            required
            placeholder={companyLoading ? "Yükleniyor…" : "Şirket seç"}
            clearable
            value={value.companyId}
            onChange={(v) => set("companyId", v)}
            options={companyOptions as unknown as { value: string; label: string; description?: string }[]}
            error={effectiveErrors.companyId}
          />
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-xs text-[var(--text-tertiary)]">
          Bireysel projede şirket alanı kullanılmaz.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FileUploadInput
          label="Banner"
          required
          accept="image/*"
          purpose="PROJECT_MEDIA"
          getDownloadUrl={(id) => `/v1/public/files/${encodeURIComponent(id)}/download`}
          value={value.banner}
          onChange={(next) => set("banner", next)}
          error={effectiveErrors.banner}
        />
        <FileUploadInput
          label="Small banner"
          required
          accept="image/*"
          purpose="PROJECT_MEDIA"
          getDownloadUrl={(id) => `/v1/public/files/${encodeURIComponent(id)}/download`}
          value={value.smallBanner}
          onChange={(next) => set("smallBanner", next)}
          error={effectiveErrors.smallBanner}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FileUploadInput
          label="Sunum video URL"
          value={value.presentationVideoUrl}
          onChange={(next) => set("presentationVideoUrl", next)}
        />
        <FileUploadInput
          label="Sunum doküman URL"
          value={value.presentationDocumentUrl}
          onChange={(next) => set("presentationDocumentUrl", next)}
        />
      </div>

      <HtmlEditor
        label="Açıklama"
        required
        editorSize="md"
        value={value.description}
        onChange={(next) => set("description", next)}
        placeholder="Proje açıklaması"
        error={effectiveErrors.description}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Gün sayısı"
          inputSize="md"
          inputMode="numeric"
          type="text"
          required
          value={value.duration}
          onChange={(e) => set("duration", digitsOnly(e.target.value))}
          placeholder="örn. 10"
          hint="Sadece tam sayı."
          error={effectiveErrors.duration}
        />
        <Select<"TRY" | "USD" | "EUR">
          label="Para birimi"
          required
          placeholder="Seçiniz"
          value={(value.currency as "TRY" | "USD" | "EUR") || null}
          onChange={(v) => set("currency", v ?? "")}
          options={CURRENCY_OPTIONS}
          error={effectiveErrors.currency}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Fiyat"
          inputSize="md"
          inputMode="decimal"
          required
          value={normalizeMoneyInput(value.price)}
          onChange={(e) => set("price", normalizeMoneyInput(e.target.value))}
          onBlur={() => set("price", padMoneyTwoDecimals(value.price))}
          placeholder="örn. 1999,90"
          hint="Virgülden sonra en az 2 basamak."
          error={effectiveErrors.price}
        />
        <Input
          label="Eski fiyat"
          inputSize="md"
          inputMode="decimal"
          value={normalizeMoneyInput(value.originalPrice)}
          onChange={(e) => set("originalPrice", normalizeMoneyInput(e.target.value))}
          onBlur={() => {
            if (!value.originalPrice.trim()) return;
            set("originalPrice", padMoneyTwoDecimals(value.originalPrice));
          }}
          placeholder="örn. 2499,90"
          hint="Opsiyonel. Girilirse 2 ondalık basamak olmalı."
          error={effectiveErrors.originalPrice}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Location (tek)"
          inputSize="md"
          required
          value={value.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="örn. London"
          error={effectiveErrors.location}
        />
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
          <div className="text-sm font-medium text-[var(--text-primary)]">İzinler</div>
          <div className="mt-2 grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Veli</span>
              <Switch checked={value.allowParent} onChange={(v) => set("allowParent", v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Öğretmen</span>
              <Switch checked={value.allowTeacher} onChange={(v) => set("allowTeacher", v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Yönetici</span>
              <Switch checked={value.allowManager} onChange={(v) => set("allowManager", v)} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-[var(--text-secondary)]">Galeri resimleri</div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
          <div className="text-xs text-[var(--text-tertiary)]">{imagesLinesHint}</div>
          <div className="mt-3 space-y-3">
            {images.length === 0 ? (
              <div className="text-sm text-[var(--text-tertiary)]">Henüz resim eklenmedi.</div>
            ) : null}
            {images.map((url, idx) => (
              <div key={`${url}-${idx}`} className="flex items-start gap-2">
                <div className="flex-1">
                  <FileUploadInput
                    label={`Resim ${idx + 1}`}
                    accept="image/*"
                    purpose="PROJECT_MEDIA"
                    getDownloadUrl={(id) => `/v1/public/files/${encodeURIComponent(id)}/download`}
                    value={url}
                    onChange={(next) => {
                      const nextArr = [...images];
                      nextArr[idx] = next;
                      set("imagesJson", jsonStringifyArray(nextArr));
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="mt-7 inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                  onClick={() => {
                    const nextArr = images.filter((_, i) => i !== idx);
                    set("imagesJson", jsonStringifyArray(nextArr));
                  }}
                  aria-label="Resmi kaldır"
                >
                  Kaldır
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Button
              variant="secondary"
              onClick={() => {
                set("imagesJson", jsonStringifyArray([...images, ""]));
              }}
              leftIcon={<Icon name="plus" size={16} />}
            >
              Resim ekle
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Textarea
          label="Primary locations"
          textareaSize="md"
          value={primaryLocations.lines}
          onChange={(e) => primaryLocations.setLines(e.target.value)}
          onBlur={() => set("primaryLocationsJson", primaryLocations.toJson(primaryLocations.lines))}
          placeholder="Her satır bir eleman (Enter ile yeni satır)"
          hint="Örn: London↵Oxford"
        />
        <Textarea
          label="Locations"
          textareaSize="md"
          value={locations.lines}
          onChange={(e) => locations.setLines(e.target.value)}
          onBlur={() => set("locationsJson", locations.toJson(locations.lines))}
          placeholder="Her satır bir eleman (Enter ile yeni satır)"
          hint="Örn: London↵Cambridge"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Textarea
          label="Included"
          textareaSize="md"
          value={included.lines}
          onChange={(e) => included.setLines(e.target.value)}
          onBlur={() => set("includedJson", included.toJson(included.lines))}
          placeholder="Her satır bir eleman"
        />
        <Textarea
          label="Excluded"
          textareaSize="md"
          value={excluded.lines}
          onChange={(e) => excluded.setLines(e.target.value)}
          onBlur={() => set("excludedJson", excluded.toJson(excluded.lines))}
          placeholder="Her satır bir eleman"
        />
      </div>

      <Textarea
        label="Highlights"
        textareaSize="md"
        value={highlights.lines}
        onChange={(e) => highlights.setLines(e.target.value)}
        onBlur={() => set("highlightsJson", highlights.toJson(highlights.lines))}
        placeholder="Her satır bir eleman"
      />

      <Textarea
        label="Itinerary"
        textareaSize="lg"
        value={itinerary.lines}
        onChange={(e) => itinerary.setLines(e.target.value)}
        onBlur={() => set("itineraryJson", itinerary.toJson(itinerary.lines))}
        placeholder="Her satır bir gün/başlık (Enter ile yeni satır)"
        hint="Örn: Varış↵Dersler↵Şehir turu"
      />
    </div>
  );
}

