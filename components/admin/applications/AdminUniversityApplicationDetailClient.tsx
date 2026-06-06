"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  adminUniversityApplicationsChangeStatus,
  adminUniversityApplicationsGet,
  ApplicationStatusChangeRequestDtoStatus,
  type UniversityApplicationDetailDto,
  type UniversityApplicationDocumentDto,
  type UniversityApplicationPortfolioFileDto,
  type UniversityApplicationPortfolioSectionDto,
  type UniversityApplicationPortfolioFileUpsertRequestDtoType,
  type UniversityApplicationNoteDto,
  type UniversityApplicationMeetingDto,
  type UniversityApplicationTaskDto,
  type UniversityApplicationPaymentDto,
} from "@/lib/api/generated/index";
import { Badge, Button, FilePreview, Icon, Input, Modal, PageHeader, Select, Textarea, useToast } from "@/components/ui";
import { FileUploadInput } from "@/components/ui/FileUploadInput";
import Link from "next/link";
import { catalogPortfolioSectionsList } from "@/lib/api/catalogPortfolioSections";
import { inferPortfolioFileType, portfolioFileTypeLabelTr } from "@/lib/applications/portfolioFileType";
import type { PortfolioSectionDto } from "@/lib/api/generated/index";
import { formatTrDateTime } from "@/lib/dates/formatTr";

type UniversityApplicationDetailWithApplicant = UniversityApplicationDetailDto & {
  applicantUserId?: string;
  applicantEmail?: string;
};

function statusLabel(status?: UniversityApplicationDetailDto["status"]) {
  switch (status) {
    case "DRAFT":
      return "Taslak";
    case "SUBMITTED":
      return "Onaylı";
    case "IN_REVIEW":
      return "İncelemede";
    case "MISSING_DOCUMENTS":
      return "Eksik Evrak";
    case "COMPLETED":
      return "Tamamlandı";
    case "REJECTED":
      return "Reddedildi";
    default:
      return status ?? "-";
  }
}

function fullName(r: Pick<UniversityApplicationDetailDto, "firstName" | "lastName">) {
  const n = `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim();
  return n || null;
}

function statusVariant(status?: UniversityApplicationDetailDto["status"]) {
  switch (status) {
    case "DRAFT":
      return "neutral" as const;
    case "SUBMITTED":
      return "info" as const;
    case "IN_REVIEW":
      return "warning" as const;
    case "MISSING_DOCUMENTS":
      return "danger" as const;
    case "COMPLETED":
      return "success" as const;
    case "REJECTED":
      return "danger" as const;
    default:
      return "outline" as const;
  }
}

type ApplicationStatus = NonNullable<UniversityApplicationDetailDto["status"]>;

const APPLICATION_STATUS_OPTIONS = [
  { value: ApplicationStatusChangeRequestDtoStatus.DRAFT, label: "Taslak" },
  { value: ApplicationStatusChangeRequestDtoStatus.SUBMITTED, label: "Onaylı" },
  { value: ApplicationStatusChangeRequestDtoStatus.IN_REVIEW, label: "İncelemede" },
  { value: ApplicationStatusChangeRequestDtoStatus.MISSING_DOCUMENTS, label: "Eksik Evrak" },
  { value: ApplicationStatusChangeRequestDtoStatus.COMPLETED, label: "Tamamlandı" },
  { value: ApplicationStatusChangeRequestDtoStatus.REJECTED, label: "Reddedildi" },
] as const satisfies Array<{ value: ApplicationStatus; label: string }>;

function Field({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <div className="text-xs font-medium text-[var(--text-tertiary)]">{label}</div>
      <div className="text-sm whitespace-pre-wrap text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

function boolTr(v?: boolean) {
  if (v === true) return "Evet";
  if (v === false) return "Hayır";
  return "-";
}

function educationLevelTr(level?: UniversityApplicationDetailDto["educationLevel"]) {
  switch (level) {
    case "BACHELOR":
      return "Lisans";
    case "MASTER":
      return "Yüksek Lisans";
    case "PHD":
      return "Doktora";
    default:
      return level ?? "-";
  }
}

function startTermTr(s?: UniversityApplicationDetailDto["startTermSeason"]) {
  switch (s) {
    case "FALL":
      return "Güz";
    case "SPRING":
      return "Bahar";
    default:
      return s ?? "-";
  }
}

function accommodationTr(a?: UniversityApplicationDetailDto["accommodationType"]) {
  switch (a) {
    case "CAMPUS_DORM":
      return "Kampüs yurdu";
    case "PRIVATE":
      return "Özel konut";
    case "ROOMMATE":
      return "Oda arkadaşı";
    default:
      return a ?? "-";
  }
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) {
    const msg = (data as unknown as { message?: string })?.message;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data;
}

/** ISO yyyy-aa-gg (veya zamanlı ISO) → gg.aa.yyyy */
function isoLocalDateToTr(iso?: string | null): string {
  if (!iso) return "";
  const d0 = iso.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d0)) return "";
  const [y, m, d] = d0.split("-");
  return `${d}.${m}.${y}`;
}

/** gg.aa.yyyy → ISO yyyy-aa-gg; boş string geçerli */
function trDateToIso(
  tr: string,
  fieldLabel = "Tarih",
): { ok: true; iso: string | null } | { ok: false; message: string } {
  const s = tr.trim();
  if (!s) return { ok: true, iso: null };
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s);
  if (!m) {
    return { ok: false, message: `${fieldLabel} gg.aa.yyyy formatında ve geçerli bir gün olmalıdır.` };
  }
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    return { ok: false, message: `Geçersiz ${fieldLabel.toLowerCase()}.` };
  }
  const dt = new Date(yyyy, mm - 1, dd);
  if (dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) {
    return { ok: false, message: `Geçersiz ${fieldLabel.toLowerCase()}.` };
  }
  return {
    ok: true,
    iso: `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`,
  };
}

/** Yalnızca rakam → gg.aa.yyyy (yazarken kısmi da desteklenir) */
function sanitizeTrDateDigitsInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

/** Yalnızca rakam → SS:DD (24 saat) */
function sanitizeTrTimeDigitsInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** API Instant (ISO) → İstanbul yerel gg.aa.yyyy + SS:DD */
function instantIsoToTrDateAndTime(iso?: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return { date: "", time: "" };
  const d = new Date(ms);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const pick = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  const day = pick("day");
  const month = pick("month");
  const year = pick("year");
  let hour = pick("hour");
  let minute = pick("minute");
  if (/^\d$/.test(hour)) hour = `0${hour}`;
  if (/^\d$/.test(minute)) minute = `0${minute}`;
  return { date: `${day}.${month}.${year}`, time: `${hour}:${minute}` };
}

/**
 * gg.aa.yyyy + SS:DD (Türkiye yerel) → UTC ISO Instant string (Jackson Instant).
 * Türkiye için yıl boyu +03 kabul edilir.
 */
function parseTrLocalDateTimeToInstantIso(
  dateTr: string,
  timeHm: string,
  dateFieldLabel = "Tarih",
): { ok: true; iso: string } | { ok: false; message: string } {
  const d = trDateToIso(dateTr, dateFieldLabel);
  if (!d.ok) return d;
  if (!d.iso) return { ok: false, message: `${dateFieldLabel} zorunludur.` };
  const tm = timeHm.trim();
  const m = /^(\d{2}):(\d{2})$/.exec(tm);
  if (!m) {
    return { ok: false, message: "Saat SS:DD formatında olmalıdır (24 saat, yalnızca rakam)." };
  }
  const hh = Number(m[1]);
  const mi = Number(m[2]);
  if (hh < 0 || hh > 23 || mi < 0 || mi > 59) {
    return { ok: false, message: "Geçersiz saat (00:00 – 23:59)." };
  }
  const localIso = `${d.iso}T${String(hh).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00+03:00`;
  const t = Date.parse(localIso);
  if (Number.isNaN(t)) {
    return { ok: false, message: "Geçersiz tarih veya saat." };
  }
  return { ok: true, iso: new Date(t).toISOString() };
}

/** API sayısı → 1.234,56 (virgülden sonra 2 hane) */
function numberToTrMoney(n: number): string {
  const [intRaw, frac] = n.toFixed(2).split(".");
  const intWithSep = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intWithSep},${frac}`;
}

/** 1.234,56 veya 1234,56 → API için "1234.56" string */
function trMoneyToApiDecimal(
  s: string,
  fieldLabel = "Tutar",
): { ok: true; value: string } | { ok: false; message: string } {
  const t = s.trim();
  if (!t) return { ok: true, value: "" };
  if (!/^(\d{1,3}(\.\d{3})*|\d+),\d{2}$/.test(t)) {
    return {
      ok: false,
      message: `${fieldLabel}: yalnızca rakam ve binlik ayraç (.) kullanın; ondalık kısım virgülle ve tam 2 hane olmalıdır (ör. 1.250,00).`,
    };
  }
  const lastComma = t.lastIndexOf(",");
  const intPart = t.slice(0, lastComma).replace(/\./g, "");
  const frac = t.slice(lastComma + 1);
  return { ok: true, value: `${intPart}.${frac}` };
}

function sanitizeTrMoneyInput(raw: string): string {
  let v = raw.replace(/[^\d.,]/g, "");
  const commaIdx = v.indexOf(",");
  if (commaIdx === -1) {
    const digits = v.replace(/\D/g, "");
    const intDots = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return intDots;
  }
  let intRaw = v.slice(0, commaIdx).replace(/\D/g, "");
  let frac = v.slice(commaIdx + 1).replace(/\D/g, "").slice(0, 2);
  const intDots = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intDots},${frac}`;
}

function finalizeTrMoneyOnBlur(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  let v = t;
  if (!v.includes(",")) {
    const digits = v.replace(/\D/g, "");
    if (!digits) return "";
    const intDots = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${intDots},00`;
  }
  const lastComma = v.lastIndexOf(",");
  let intPart = v.slice(0, lastComma).replace(/\D/g, "");
  let frac = (v.slice(lastComma + 1).replace(/\D/g, "") + "00").slice(0, 2);
  const intDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intDots},${frac}`;
}

type ScalarCurrencyCode = "TRY" | "USD" | "EUR" | "GBP";

const SCALAR_CURRENCY_OPTIONS: { value: ScalarCurrencyCode; label: string }[] = [
  { value: "TRY", label: "Türk lirası (TRY)" },
  { value: "USD", label: "Amerikan doları (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "Sterlin (GBP)" },
];

function normalizeCurrencyForForm(c?: string | null): ScalarCurrencyCode | null {
  const u = (c ?? "").trim().toUpperCase();
  if (u === "TRY" || u === "TL" || u === "TLR") return "TRY";
  if (u === "USD") return "USD";
  if (u === "EUR") return "EUR";
  if (u === "GBP") return "GBP";
  return null;
}

function currencyLabelTr(c?: string | null) {
  const n = normalizeCurrencyForForm(c);
  const opt = SCALAR_CURRENCY_OPTIONS.find((o) => o.value === n);
  return opt?.label ?? (c && String(c).trim() ? String(c).trim() : "-");
}

type ScalarEducation = NonNullable<UniversityApplicationDetailDto["educationLevel"]>;
type ScalarStartTerm = NonNullable<UniversityApplicationDetailDto["startTermSeason"]>;
type ScalarAccommodation = NonNullable<UniversityApplicationDetailDto["accommodationType"]>;
type TaskStatus = NonNullable<UniversityApplicationTaskDto["status"]>;

const SCALAR_EDUCATION_OPTIONS: { value: ScalarEducation; label: string }[] = [
  { value: "BACHELOR", label: "Lisans" },
  { value: "MASTER", label: "Yüksek lisans" },
  { value: "PHD", label: "Doktora" },
];

const SCALAR_START_TERM_OPTIONS: { value: ScalarStartTerm; label: string }[] = [
  { value: "FALL", label: "Güz" },
  { value: "SPRING", label: "Bahar" },
];

const SCALAR_ACCOMMODATION_OPTIONS: { value: ScalarAccommodation; label: string }[] = [
  { value: "CAMPUS_DORM", label: "Kampüs yurdu" },
  { value: "PRIVATE", label: "Özel konut" },
  { value: "ROOMMATE", label: "Oda arkadaşı" },
];

const TASK_STATUS_FORM_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "PENDING", label: "Beklemede" },
  { value: "DONE", label: "Tamamlandı" },
];

type DetailRightAccordionId =
  | "preferences"
  | "notes"
  | "meetings"
  | "tasks"
  | "payments"
  | "documents"
  | "portfolio";

function DetailRightAccordionItem({
  id,
  openId,
  onOpen,
  title,
  actions,
  children,
}: {
  id: DetailRightAccordionId;
  openId: DetailRightAccordionId;
  onOpen: (next: DetailRightAccordionId) => void;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const open = openId === id;
  return (
    <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-subtle)] bg-[var(--surface-0)]">
      <div className="flex w-full items-center gap-2 px-4 py-3 sm:px-5 sm:py-4">
        <button
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] py-1 text-left text-sm font-semibold text-[var(--text-primary)] outline-none hover:bg-[var(--surface-1)] focus-visible:shadow-[var(--ring-accent)]"
          onClick={() => onOpen(id)}
          aria-expanded={open}
          id={`detail-acc-${id}`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[var(--text-tertiary)]" aria-hidden>
            <Icon name={open ? "chevron-down" : "chevron-right"} size={18} />
          </span>
          <span className="min-w-0">{title}</span>
        </button>
        {actions ? <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div> : null}
      </div>
      {open ? (
        <div className="border-t border-[var(--border-subtle)] px-4 pb-4 pt-1 sm:px-5 sm:pb-5" role="region" aria-labelledby={`detail-acc-${id}`}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function AdminUniversityApplicationDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;
  const isCreate = id === "new";

  const [loading, setLoading] = React.useState(() => !isCreate);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<UniversityApplicationDetailDto | null>(null);

  const [busy, setBusy] = React.useState(false);
  const [openRightAccordion, setOpenRightAccordion] = React.useState<DetailRightAccordionId>("notes");

  // Scalar update modal state
  const [scalarOpen, setScalarOpen] = React.useState(false);
  const [scalarForm, setScalarForm] = React.useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    phone: "",
    nationality: "",
    address: "",
    currentSchool: "",
    student: false,
    classLevel: "",
    referencePerson: "",
    consultancy: false,
    followerPerson: "",
    educationLevel: "",
    startTermSeason: "",
    startYear: "",
    yearlyBudgetMin: "",
    yearlyBudgetMax: "",
    scholarshipRequested: false,
    scholarshipType: "",
    accommodationType: "",
    priceAmount: "",
    priceCurrency: "",
    notes: "",
  });
  const [scalarErrors, setScalarErrors] = React.useState<{
    firstName?: string;
    lastName?: string;
    educationLevel?: string;
  }>({});

  // String-list modal state (department/country/university prefs)
  const [prefOpen, setPrefOpen] = React.useState(false);
  const [prefKind, setPrefKind] = React.useState<"department-preferences" | "country-preferences" | "university-preferences" | null>(null);
  const [prefEditingIndex, setPrefEditingIndex] = React.useState<number | null>(null);
  const [prefValue, setPrefValue] = React.useState("");

  // Notes modal state
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<UniversityApplicationNoteDto | null>(null);
  const [noteText, setNoteText] = React.useState("");

  // Meetings modal state
  const [meetingOpen, setMeetingOpen] = React.useState(false);
  const [editingMeeting, setEditingMeeting] = React.useState<UniversityApplicationMeetingDto | null>(null);
  const [meetingForm, setMeetingForm] = React.useState({
    person: "",
    meetingDate: "",
    meetingTime: "",
    meetingNote: "",
    meetingResult: "",
  });

  // Tasks modal state
  const [taskOpen, setTaskOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<UniversityApplicationTaskDto | null>(null);
  const [taskForm, setTaskForm] = React.useState({
    scheduledDate: "",
    scheduledTime: "",
    withWhom: "",
    whatToDo: "",
    status: "PENDING" as UniversityApplicationTaskDto["status"],
  });

  // Payments modal state
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [editingPayment, setEditingPayment] = React.useState<UniversityApplicationPaymentDto | null>(null);
  const [paymentForm, setPaymentForm] = React.useState({
    paymentDate: "",
    amount: "",
    currency: "" as ScalarCurrencyCode | "",
    receivedBy: "",
  });

  // Documents modal state
  const [docOpen, setDocOpen] = React.useState(false);
  const [editingDoc, setEditingDoc] = React.useState<UniversityApplicationDocumentDto | null>(null);
  const [docForm, setDocForm] = React.useState({
    required: false,
    documentName: "",
    documentDescription: "",
    documentUrl: "",
  });

  const [catalogSections, setCatalogSections] = React.useState<PortfolioSectionDto[]>([]);

  React.useEffect(() => {
    void catalogPortfolioSectionsList({ page: 0, size: 200 }).then((res) => {
      if (res.status >= 200 && res.status < 300) {
        setCatalogSections(res.data.items ?? []);
      }
    });
  }, []);

  const catalogSectionOptions = React.useMemo(
    () =>
      catalogSections
        .filter((s): s is PortfolioSectionDto & { id: string } => !!s.id && s.active !== false)
        .map((s) => ({
          value: s.id,
          label: s.name ?? s.id,
          description: s.educationLevel
            ? `${s.educationLevel}${s.departmentKeyword ? ` • ${s.departmentKeyword}` : ""}`
            : s.departmentKeyword ?? undefined,
        })),
    [catalogSections],
  );

  // Portfolio section modal state
  const [sectionOpen, setSectionOpen] = React.useState(false);
  const [editingSection, setEditingSection] = React.useState<UniversityApplicationPortfolioSectionDto | null>(null);
  const [sectionForm, setSectionForm] = React.useState({
    required: false,
    sortOrder: 0,
    sectionNameOverride: "",
    sectionDescriptionOverride: "",
    portfolioSectionId: "" as string,
  });

  // Portfolio file modal state
  const [fileOpen, setFileOpen] = React.useState(false);
  const [fileCtx, setFileCtx] = React.useState<{ sectionId: string } | null>(null);
  const [editingFile, setEditingFile] = React.useState<UniversityApplicationPortfolioFileDto | null>(null);
  const [fileAddMode, setFileAddMode] = React.useState<"file" | "link">("file");
  const [fileForm, setFileForm] = React.useState<{
    type: UniversityApplicationPortfolioFileUpsertRequestDtoType | null;
    name: string;
    description: string;
    fileUrl: string;
  }>({ type: "OTHER", name: "", description: "", fileUrl: "" });

  /** Yeni başvuru: mevcut USER veya yeni hesap */
  const [applicantMode, setApplicantMode] = React.useState<"existing" | "new">("existing");
  const [applicantUserId, setApplicantUserId] = React.useState<string | null>(null);
  const [newApplicantEmail, setNewApplicantEmail] = React.useState("");
  const [newApplicantPassword, setNewApplicantPassword] = React.useState("");
  const [userOptions, setUserOptions] = React.useState<{ value: string; label: string; description?: string }[]>([]);
  /** Seçili kullanıcı listede yokken (ör. arama değişince) tetikte ad-soyadın kaybolmaması için */
  const [pinnedApplicantOption, setPinnedApplicantOption] = React.useState<{
    value: string;
    label: string;
    description?: string;
  } | null>(null);
  /** Mevcut kullanıcı + API’den profil bilgisi geldiyse kimlik alanları salt okunur */
  const [applicantIdentityLocked, setApplicantIdentityLocked] = React.useState(false);
  const [usersLoading, setUsersLoading] = React.useState(false);

  const mergedApplicantUserOptions = React.useMemo(() => {
    if (!pinnedApplicantOption) return userOptions;
    if (userOptions.some((o) => o.value === pinnedApplicantOption.value)) return userOptions;
    return [pinnedApplicantOption, ...userOptions];
  }, [userOptions, pinnedApplicantOption]);

  /** Mevcut kullanıcı seçildiğinde ve profilden veri geldiyse kimlik/iletişim alanları salt okunur */
  const applicantIdentityFieldsReadOnly =
    isCreate && applicantMode === "existing" && !!applicantUserId && applicantIdentityLocked;

  const reload = React.useCallback(async () => {
    if (isCreate) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);

    const res = await adminUniversityApplicationsGet(id).catch((e: unknown) => {
      return {
        status: 0,
        data: null,
        error: e instanceof Error ? e.message : "İstek başarısız",
      } as const;
    });

    if (res.status >= 200 && res.status < 300) {
      setData(res.data ?? null);
    } else {
      setData(null);
      setError(
        (res as unknown as { error?: string })?.error ??
          `Detay yüklenemedi (HTTP ${res.status})`,
      );
    }

    setLoading(false);
  }, [id, isCreate]);

  const changeApplicationStatus = React.useCallback(
    async (next: ApplicationStatus) => {
      if (isCreate || !data?.id || next === data.status) return;

      setBusy(true);
      try {
        const res = await adminUniversityApplicationsChangeStatus(data.id, { status: next }).catch(
          (e: unknown) => ({
            status: 0,
            data: null,
            error: e instanceof Error ? e.message : "İstek başarısız",
          }),
        );

        if (res.status >= 200 && res.status < 300 && res.data) {
          setData(res.data);
          toastRef.current.success({
            title: "Durum güncellendi",
            description: statusLabel(next),
          });
        } else {
          toastRef.current.error({
            title: "Durum güncellenemedi",
            description:
              (res as { error?: string }).error ?? `İstek başarısız (HTTP ${res.status})`,
          });
        }
      } finally {
        setBusy(false);
      }
    },
    [data?.id, data?.status, isCreate],
  );

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const title = isCreate
    ? "Yeni üniversite başvurusu"
    : data
      ? fullName(data) ?? "Üniversite Başvurusu"
      : "Üniversite Başvurusu";

  const openScalarEdit = () => {
    if (!data) return;
    setScalarErrors({});
    setScalarForm({
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      birthDate: isoLocalDateToTr(data.birthDate),
      phone: data.phone ?? "",
      nationality: data.nationality ?? "",
      address: data.address ?? "",
      currentSchool: data.currentSchool ?? "",
      student: !!data.student,
      classLevel: data.classLevel ?? "",
      referencePerson: data.referencePerson ?? "",
      consultancy: !!data.consultancy,
      followerPerson: data.followerPerson ?? "",
      educationLevel: (data.educationLevel ?? "") as string,
      startTermSeason: (data.startTermSeason ?? "") as string,
      startYear: data.startYear != null ? String(data.startYear) : "",
      yearlyBudgetMin:
        data.yearlyBudgetMin != null && Number.isFinite(Number(data.yearlyBudgetMin))
          ? numberToTrMoney(Number(data.yearlyBudgetMin))
          : "",
      yearlyBudgetMax:
        data.yearlyBudgetMax != null && Number.isFinite(Number(data.yearlyBudgetMax))
          ? numberToTrMoney(Number(data.yearlyBudgetMax))
          : "",
      scholarshipRequested: !!data.scholarshipRequested,
      scholarshipType: data.scholarshipType ?? "",
      accommodationType: (data.accommodationType ?? "") as string,
      priceAmount:
        data.priceAmount != null && Number.isFinite(Number(data.priceAmount))
          ? numberToTrMoney(Number(data.priceAmount))
          : "",
      priceCurrency: normalizeCurrencyForForm(data.priceCurrency) ?? "",
      notes: data.notes ?? "",
    });
    setScalarOpen(true);
  };

  /** Select onSearch bu referansa bağlı; toast her render'da değişebildiği için ref kullanıyoruz (sonsuz istek döngüsünü önler). */
  const fetchUserOptions = React.useCallback(async (query: string) => {
    setUsersLoading(true);
    try {
      const sp = new URLSearchParams({ page: "0", size: "100", role: "USER" });
      const t = query.trim();
      if (t) sp.set("q", t);
      const res = await fetch(`/api/proxy/v1/admin/users?${sp.toString()}`, { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as {
        items?: Array<{
          id?: string;
          email?: string;
          applicantFirstName?: string | null;
          applicantLastName?: string | null;
        }>;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(j.message || `HTTP ${res.status}`);
      }
      const opts =
        j.items
          ?.filter((x) => x.id && x.email)
          .map((x) => {
            const fn = (x.applicantFirstName ?? "").trim();
            const ln = (x.applicantLastName ?? "").trim();
            const fullName = `${fn} ${ln}`.trim();
            const email = String(x.email);
            return {
              value: String(x.id),
              label: fullName || email,
              description: fullName ? email : undefined,
            };
          }) ?? [];
      setUserOptions(opts);
    } catch (e) {
      toastRef.current.error({
        title: "Kullanıcı listesi",
        description: e instanceof Error ? e.message : "Yüklenemedi",
      });
      setUserOptions([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadApplicantDetailForCreate = React.useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/proxy/v1/admin/users/${encodeURIComponent(userId)}`, { cache: "no-store" });
      const d = (await res.json().catch(() => ({}))) as {
        email?: string;
        applicantFirstName?: string | null;
        applicantLastName?: string | null;
        birthDate?: string | null;
        phone?: string | null;
        nationality?: string | null;
        address?: string | null;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(d.message || `HTTP ${res.status}`);
      }
      const fn = (d.applicantFirstName ?? "").trim();
      const ln = (d.applicantLastName ?? "").trim();
      const full = `${fn} ${ln}`.trim();
      const email = String(d.email ?? "");
      setPinnedApplicantOption({
        value: userId,
        label: full || email,
        description: full ? email : undefined,
      });
      const hasProfileBits =
        !!fn ||
        !!ln ||
        !!(d.birthDate && String(d.birthDate).trim()) ||
        !!(d.phone && d.phone.trim()) ||
        !!(d.nationality && d.nationality.trim()) ||
        !!(d.address && d.address.trim());
      setApplicantIdentityLocked(hasProfileBits);
      setScalarForm((s) => ({
        ...s,
        firstName: fn,
        lastName: ln,
        birthDate: isoLocalDateToTr(d.birthDate),
        phone: (d.phone ?? "").trim(),
        nationality: (d.nationality ?? "").trim(),
        address: (d.address ?? "").trim(),
      }));
    } catch (e) {
      setPinnedApplicantOption(null);
      setApplicantIdentityLocked(false);
      toastRef.current.error({
        title: "Kullanıcı bilgisi",
        description: e instanceof Error ? e.message : "Yüklenemedi",
      });
    }
  }, []);

  const openCreateApplicationModal = () => {
    if (!isCreate) return;
    setScalarErrors({});
    setApplicantMode("existing");
    setApplicantUserId(null);
    setPinnedApplicantOption(null);
    setApplicantIdentityLocked(false);
    setNewApplicantEmail("");
    setNewApplicantPassword("");
    setUserOptions([]);
    setScalarForm({
      firstName: "",
      lastName: "",
      birthDate: "",
      phone: "",
      nationality: "",
      address: "",
      currentSchool: "",
      student: false,
      classLevel: "",
      referencePerson: "",
      consultancy: false,
      followerPerson: "",
      educationLevel: "",
      startTermSeason: "",
      startYear: "",
      yearlyBudgetMin: "",
      yearlyBudgetMax: "",
      scholarshipRequested: false,
      scholarshipType: "",
      accommodationType: "",
      priceAmount: "",
      priceCurrency: "",
      notes: "",
    });
    setScalarOpen(true);
    void fetchUserOptions("");
  };

  const submitScalar = async () => {
    if (!isCreate && !data?.id) return;
    setBusy(true);
    try {
      const fn = scalarForm.firstName.trim();
      const ln = scalarForm.lastName.trim();
      const nameErr: { firstName?: string; lastName?: string } = {};
      if (!fn) nameErr.firstName = "Ad zorunludur.";
      if (!ln) nameErr.lastName = "Soyad zorunludur.";
      if (Object.keys(nameErr).length) {
        setScalarErrors(nameErr);
        toast.error({ title: "Eksik bilgi", description: "Ad ve soyad boş bırakılamaz." });
        setBusy(false);
        return;
      }
      setScalarErrors({});

      const edu = (scalarForm.educationLevel ?? "").trim();
      if (!edu) {
        setScalarErrors({ educationLevel: "Eğitim seviyesi zorunludur." });
        toast.error({ title: "Eksik bilgi", description: "Eğitim seviyesi seçilmelidir." });
        setBusy(false);
        return;
      }

      const birth = trDateToIso(scalarForm.birthDate, "Doğum tarihi");
      if (!birth.ok) {
        toast.error({ title: "Geçersiz tarih", description: birth.message });
        setBusy(false);
        return;
      }

      const priceParsed = trMoneyToApiDecimal(scalarForm.priceAmount, "Ücret tutarı");
      if (!priceParsed.ok) {
        toast.error({ title: "Geçersiz ücret", description: priceParsed.message });
        setBusy(false);
        return;
      }
      const hasPrice = priceParsed.value !== "";
      const cur = (scalarForm.priceCurrency ?? "").trim() as ScalarCurrencyCode | "";
      if (hasPrice && !cur) {
        toast.error({ title: "Eksik bilgi", description: "Ücret girildiğinde para birimi seçilmelidir." });
        setBusy(false);
        return;
      }
      if (!hasPrice && cur) {
        toast.error({ title: "Eksik bilgi", description: "Para birimi seçildiğinde ücret tutarı girilmelidir." });
        setBusy(false);
        return;
      }
      const priceNum = hasPrice ? Number(priceParsed.value) : null;

      const budgetMinParsed = trMoneyToApiDecimal(scalarForm.yearlyBudgetMin, "Minimum yıllık bütçe");
      if (!budgetMinParsed.ok) {
        toast.error({ title: "Geçersiz bütçe", description: budgetMinParsed.message });
        setBusy(false);
        return;
      }
      const budgetMaxParsed = trMoneyToApiDecimal(scalarForm.yearlyBudgetMax, "Maksimum yıllık bütçe");
      if (!budgetMaxParsed.ok) {
        toast.error({ title: "Geçersiz bütçe", description: budgetMaxParsed.message });
        setBusy(false);
        return;
      }
      const yearlyBudgetMinNum = budgetMinParsed.value === "" ? null : Number(budgetMinParsed.value);
      const yearlyBudgetMaxNum = budgetMaxParsed.value === "" ? null : Number(budgetMaxParsed.value);

      const patchPayload = {
        firstName: fn,
        lastName: ln,
        birthDate: birth.iso,
        phone: scalarForm.phone || null,
        nationality: scalarForm.nationality || null,
        address: scalarForm.address || null,
        currentSchool: scalarForm.currentSchool || null,
        student: scalarForm.student,
        classLevel: scalarForm.student ? (scalarForm.classLevel.trim() || null) : null,
        referencePerson: scalarForm.referencePerson || null,
        consultancy: scalarForm.consultancy,
        followerPerson: scalarForm.followerPerson || null,
        educationLevel: edu,
        startTermSeason: scalarForm.startTermSeason || null,
        startYear: scalarForm.startYear ? Number(scalarForm.startYear) : null,
        yearlyBudgetMin: yearlyBudgetMinNum,
        yearlyBudgetMax: yearlyBudgetMaxNum,
        scholarshipRequested: scalarForm.scholarshipRequested,
        scholarshipType: scalarForm.scholarshipType || null,
        accommodationType: scalarForm.accommodationType || null,
        priceAmount: priceNum,
        priceCurrency: hasPrice ? cur : null,
        notes: scalarForm.notes || null,
      };

      if (isCreate) {
        if (applicantMode === "existing") {
          if (!applicantUserId) {
            toast.error({ title: "Eksik bilgi", description: "Başvuru sahibi olarak bir kullanıcı seçin." });
            setBusy(false);
            return;
          }
        } else {
          const em = newApplicantEmail.trim().toLowerCase();
          if (!em) {
            toast.error({ title: "Eksik bilgi", description: "Yeni kullanıcı için e-posta girin." });
            setBusy(false);
            return;
          }
          if (newApplicantPassword.length < 8) {
            toast.error({ title: "Geçersiz parola", description: "Parola en az 8 karakter olmalıdır." });
            setBusy(false);
            return;
          }
        }

        const createBody = {
          applicantUserId: applicantMode === "existing" ? applicantUserId : null,
          newApplicant:
            applicantMode === "new"
              ? { email: newApplicantEmail.trim().toLowerCase(), password: newApplicantPassword }
              : null,
          educationLevel: edu,
          status: "DRAFT",
          initialSnapshot: patchPayload,
        };

        const created = await apiJson<UniversityApplicationDetailDto & { id?: string }>(
          "/api/proxy/v1/admin/university-applications",
          { method: "POST", body: JSON.stringify(createBody) },
        );
        const newId = created?.id;
        if (!newId) {
          throw new Error("Oluşturma yanıtında başvuru kimliği yok");
        }

        toast.success({ title: "Oluşturuldu", description: "Taslak başvuru kaydı açıldı." });
        setScalarOpen(false);
        router.replace(`/admin/university-applications/${encodeURIComponent(String(newId))}`);
        return;
      }

      await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data!.id))}`, {
        method: "PATCH",
        body: JSON.stringify(patchPayload),
      });
      toast.success({ title: "Güncellendi", description: "Tekil alanlar güncellendi." });
      setScalarOpen(false);
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "İşlem başarısız" });
    } finally {
      setBusy(false);
    }
  };

  const openAddPref = (kind: NonNullable<typeof prefKind>) => {
    setOpenRightAccordion("preferences");
    setPrefKind(kind);
    setPrefEditingIndex(null);
    setPrefValue("");
    setPrefOpen(true);
  };
  const openEditPref = (kind: NonNullable<typeof prefKind>, idx: number, value: string) => {
    setPrefKind(kind);
    setPrefEditingIndex(idx);
    setPrefValue(value);
    setPrefOpen(true);
  };

  const submitPref = async () => {
    if (!data?.id || !prefKind) return;
    const base = `/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/${prefKind}`;
    setBusy(true);
    try {
      const body = JSON.stringify({ value: prefValue });
      if (prefEditingIndex === null) {
        await apiJson(base, { method: "POST", body });
        toast.success({ title: "Eklendi", description: "Liste elemanı eklendi." });
      } else {
        await apiJson(`${base}/${prefEditingIndex}`, { method: "PUT", body });
        toast.success({ title: "Güncellendi", description: "Liste elemanı güncellendi." });
      }
      setPrefOpen(false);
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "İşlem başarısız" });
    } finally {
      setBusy(false);
    }
  };

  const deletePref = async (kind: NonNullable<typeof prefKind>, idx: number) => {
    if (!data?.id) return;
    const url = `/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/${kind}/${idx}`;
    setBusy(true);
    try {
      await apiJson(url, { method: "DELETE" });
      toast.success({ title: "Silindi", description: "Liste elemanı silindi." });
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "Silinemedi" });
    } finally {
      setBusy(false);
    }
  };

  const openAddNote = () => {
    setOpenRightAccordion("notes");
    setEditingNote(null);
    setNoteText("");
    setNoteOpen(true);
  };
  const openEditNote = (n: UniversityApplicationNoteDto) => {
    setEditingNote(n);
    setNoteText(n.todoText ?? "");
    setNoteOpen(true);
  };
  const submitNote = async () => {
    if (!data?.id) return;
    setBusy(true);
    try {
      if (editingNote?.id) {
        await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/notes/${encodeURIComponent(String(editingNote.id))}`, {
          method: "PATCH",
          body: JSON.stringify({ todoText: noteText }),
        });
        toast.success({ title: "Güncellendi", description: "Not güncellendi." });
      } else {
        await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/notes`, {
          method: "POST",
          body: JSON.stringify({ todoText: noteText }),
        });
        toast.success({ title: "Eklendi", description: "Not eklendi." });
      }
      setNoteOpen(false);
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "İşlem başarısız" });
    } finally {
      setBusy(false);
    }
  };
  const deleteNote = async (noteId: string) => {
    if (!data?.id) return;
    setBusy(true);
    try {
      await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/notes/${encodeURIComponent(noteId)}`, { method: "DELETE" });
      toast.success({ title: "Silindi", description: "Not silindi." });
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "Silinemedi" });
    } finally {
      setBusy(false);
    }
  };

  const openAddMeeting = () => {
    setOpenRightAccordion("meetings");
    setEditingMeeting(null);
    setMeetingForm({ person: "", meetingDate: "", meetingTime: "", meetingNote: "", meetingResult: "" });
    setMeetingOpen(true);
  };
  const openEditMeeting = (m: UniversityApplicationMeetingDto) => {
    setEditingMeeting(m);
    const dt = instantIsoToTrDateAndTime(m.meetingAt);
    setMeetingForm({
      person: m.person ?? "",
      meetingDate: dt.date,
      meetingTime: dt.time,
      meetingNote: m.meetingNote ?? "",
      meetingResult: m.meetingResult ?? "",
    });
    setMeetingOpen(true);
  };
  const submitMeeting = async () => {
    if (!data?.id) return;
    setBusy(true);
    try {
      const person = meetingForm.person.trim();
      if (!person) {
        toast.error({ title: "Eksik bilgi", description: "Kişi alanı zorunludur." });
        setBusy(false);
        return;
      }
      const when = parseTrLocalDateTimeToInstantIso(meetingForm.meetingDate, meetingForm.meetingTime, "Görüşme tarihi");
      if (!when.ok) {
        toast.error({ title: "Geçersiz tarih/saat", description: when.message });
        setBusy(false);
        return;
      }
      const body = JSON.stringify({
        person,
        meetingAt: when.iso,
        meetingNote: meetingForm.meetingNote.trim() || null,
        meetingResult: meetingForm.meetingResult.trim() || null,
      });
      if (editingMeeting?.id) {
        await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/meetings/${encodeURIComponent(String(editingMeeting.id))}`, {
          method: "PATCH",
          body,
        });
        toast.success({ title: "Güncellendi", description: "Görüşme güncellendi." });
      } else {
        await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/meetings`, { method: "POST", body });
        toast.success({ title: "Eklendi", description: "Görüşme eklendi." });
      }
      setMeetingOpen(false);
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "İşlem başarısız" });
    } finally {
      setBusy(false);
    }
  };
  const deleteMeeting = async (meetingId: string) => {
    if (!data?.id) return;
    setBusy(true);
    try {
      await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/meetings/${encodeURIComponent(meetingId)}`, { method: "DELETE" });
      toast.success({ title: "Silindi", description: "Görüşme silindi." });
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "Silinemedi" });
    } finally {
      setBusy(false);
    }
  };

  const openAddTask = () => {
    setOpenRightAccordion("tasks");
    setEditingTask(null);
    setTaskForm({ scheduledDate: "", scheduledTime: "", withWhom: "", whatToDo: "", status: "PENDING" });
    setTaskOpen(true);
  };
  const openEditTask = (t: UniversityApplicationTaskDto) => {
    setEditingTask(t);
    const dt = instantIsoToTrDateAndTime(t.scheduledAt);
    setTaskForm({
      scheduledDate: dt.date,
      scheduledTime: dt.time,
      withWhom: t.withWhom ?? "",
      whatToDo: t.whatToDo ?? "",
      status: (t.status ?? "PENDING") as UniversityApplicationTaskDto["status"],
    });
    setTaskOpen(true);
  };
  const submitTask = async () => {
    if (!data?.id) return;
    setBusy(true);
    try {
      const what = taskForm.whatToDo.trim();
      const whom = taskForm.withWhom.trim();
      if (!what || !whom) {
        toast.error({ title: "Eksik bilgi", description: "Ne yapılacak ve Kiminle alanları zorunludur." });
        setBusy(false);
        return;
      }
      const when = parseTrLocalDateTimeToInstantIso(taskForm.scheduledDate, taskForm.scheduledTime, "Görev tarihi");
      if (!when.ok) {
        toast.error({ title: "Geçersiz tarih/saat", description: when.message });
        setBusy(false);
        return;
      }
      const body = JSON.stringify({
        scheduledAt: when.iso,
        withWhom: whom,
        whatToDo: what,
        status: taskForm.status || null,
      });
      if (editingTask?.id) {
        await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/tasks/${encodeURIComponent(String(editingTask.id))}`, {
          method: "PATCH",
          body,
        });
        toast.success({ title: "Güncellendi", description: "Görev güncellendi." });
      } else {
        await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/tasks`, { method: "POST", body });
        toast.success({ title: "Eklendi", description: "Görev eklendi." });
      }
      setTaskOpen(false);
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "İşlem başarısız" });
    } finally {
      setBusy(false);
    }
  };
  const deleteTask = async (taskId: string) => {
    if (!data?.id) return;
    setBusy(true);
    try {
      await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
      toast.success({ title: "Silindi", description: "Görev silindi." });
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "Silinemedi" });
    } finally {
      setBusy(false);
    }
  };

  const openAddPayment = () => {
    setOpenRightAccordion("payments");
    setEditingPayment(null);
    setPaymentForm({ paymentDate: "", amount: "", currency: "", receivedBy: "" });
    setPaymentOpen(true);
  };
  const openEditPayment = (p: UniversityApplicationPaymentDto) => {
    setEditingPayment(p);
    const dt = instantIsoToTrDateAndTime(p.paymentAt);
    setPaymentForm({
      paymentDate: dt.date,
      amount: p.amount != null ? numberToTrMoney(Number(p.amount)) : "",
      currency: normalizeCurrencyForForm(p.currency) ?? "",
      receivedBy: p.receivedBy ?? "",
    });
    setPaymentOpen(true);
  };
  const submitPayment = async () => {
    if (!data?.id) return;
    setBusy(true);
    try {
      const when = parseTrLocalDateTimeToInstantIso(paymentForm.paymentDate, "00:00", "Ödeme tarihi");
      if (!when.ok) {
        toast.error({ title: "Geçersiz tarih", description: when.message });
        setBusy(false);
        return;
      }
      const amountParsed = trMoneyToApiDecimal(paymentForm.amount, "Ödeme tutarı");
      if (!amountParsed.ok) {
        toast.error({ title: "Geçersiz tutar", description: amountParsed.message });
        setBusy(false);
        return;
      }
      if (amountParsed.value === "") {
        toast.error({ title: "Eksik bilgi", description: "Ödeme tutarı zorunludur." });
        setBusy(false);
        return;
      }
      const cur = (paymentForm.currency ?? "").trim() as ScalarCurrencyCode | "";
      if (!cur) {
        toast.error({ title: "Eksik bilgi", description: "Para birimi seçilmelidir." });
        setBusy(false);
        return;
      }
      const body = JSON.stringify({
        paymentAt: when.iso,
        amount: Number(amountParsed.value),
        currency: cur,
        receivedBy: paymentForm.receivedBy.trim() || null,
      });
      if (editingPayment?.id) {
        await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/payments/${encodeURIComponent(String(editingPayment.id))}`, {
          method: "PATCH",
          body,
        });
        toast.success({ title: "Güncellendi", description: "Ödeme güncellendi." });
      } else {
        await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/payments`, { method: "POST", body });
        toast.success({ title: "Eklendi", description: "Ödeme eklendi." });
      }
      setPaymentOpen(false);
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "İşlem başarısız" });
    } finally {
      setBusy(false);
    }
  };
  const deletePayment = async (paymentId: string) => {
    if (!data?.id) return;
    setBusy(true);
    try {
      await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/payments/${encodeURIComponent(paymentId)}`, { method: "DELETE" });
      toast.success({ title: "Silindi", description: "Ödeme silindi." });
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "Silinemedi" });
    } finally {
      setBusy(false);
    }
  };

  const openAddDoc = () => {
    setOpenRightAccordion("documents");
    setEditingDoc(null);
    setDocForm({ required: false, documentName: "", documentDescription: "", documentUrl: "" });
    setDocOpen(true);
  };
  const openEditDoc = (d: UniversityApplicationDocumentDto) => {
    setEditingDoc(d);
    setDocForm({
      required: !!d.required,
      documentName: d.documentName ?? "",
      documentDescription: d.documentDescription ?? "",
      documentUrl: d.documentUrl ?? "",
    });
    setDocOpen(true);
  };

  const submitDoc = async () => {
    if (!data?.id) return;
    setBusy(true);
    try {
      const body = JSON.stringify({
        required: docForm.required,
        documentName: docForm.documentName || null,
        documentDescription: docForm.documentDescription || null,
        documentUrl: docForm.documentUrl || null,
      });
      if (editingDoc?.id) {
        await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/documents/${encodeURIComponent(String(editingDoc.id))}`, {
          method: "PATCH",
          body,
        });
        toast.success({ title: "Güncellendi", description: "Doküman güncellendi." });
      } else {
        await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/documents`, {
          method: "POST",
          body,
        });
        toast.success({ title: "Eklendi", description: "Doküman eklendi." });
      }
      setDocOpen(false);
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "İşlem başarısız" });
    } finally {
      setBusy(false);
    }
  };

  const deleteDoc = async (docId: string) => {
    if (!data?.id) return;
    setBusy(true);
    try {
      await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/documents/${encodeURIComponent(docId)}`, {
        method: "DELETE",
      });
      toast.success({ title: "Silindi", description: "Doküman silindi." });
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "Silinemedi" });
    } finally {
      setBusy(false);
    }
  };

  const openAddSection = () => {
    setOpenRightAccordion("portfolio");
    setEditingSection(null);
    setSectionForm({
      required: false,
      sortOrder: 0,
      sectionNameOverride: "",
      sectionDescriptionOverride: "",
      portfolioSectionId: "",
    });
    setSectionOpen(true);
  };

  const openEditSection = (s: UniversityApplicationPortfolioSectionDto) => {
    setEditingSection(s);
    setSectionForm({
      required: !!s.required,
      sortOrder: s.sortOrder ?? 0,
      sectionNameOverride: s.sectionNameOverride ?? "",
      sectionDescriptionOverride: s.sectionDescriptionOverride ?? "",
      portfolioSectionId: s.portfolioSectionId ? String(s.portfolioSectionId) : "",
    });
    setSectionOpen(true);
  };

  const submitSection = async () => {
    if (!data?.id) return;
    setBusy(true);
    try {
      const body = JSON.stringify({
        required: sectionForm.required,
        sortOrder: sectionForm.sortOrder,
        sectionNameOverride: sectionForm.sectionNameOverride || null,
        sectionDescriptionOverride: sectionForm.sectionDescriptionOverride || null,
        portfolioSectionId: sectionForm.portfolioSectionId ? sectionForm.portfolioSectionId : null,
      });
      if (editingSection?.id) {
        await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/portfolio-sections/${encodeURIComponent(String(editingSection.id))}`, {
          method: "PATCH",
          body,
        });
        toast.success({ title: "Güncellendi", description: "Portfolyo bölümü güncellendi." });
      } else {
        await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/portfolio-sections`, {
          method: "POST",
          body,
        });
        toast.success({ title: "Eklendi", description: "Portfolyo bölümü eklendi." });
      }
      setSectionOpen(false);
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "İşlem başarısız" });
    } finally {
      setBusy(false);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!data?.id) return;
    setBusy(true);
    try {
      await apiJson(`/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/portfolio-sections/${encodeURIComponent(sectionId)}`, {
        method: "DELETE",
      });
      toast.success({ title: "Silindi", description: "Portfolyo bölümü silindi." });
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "Silinemedi" });
    } finally {
      setBusy(false);
    }
  };

  const openAddFile = (sectionId: string) => {
    setOpenRightAccordion("portfolio");
    setFileCtx({ sectionId });
    setEditingFile(null);
    setFileAddMode("file");
    setFileForm({ type: "OTHER", name: "", description: "", fileUrl: "" });
    setFileOpen(true);
  };

  const openEditFile = (sectionId: string, f: UniversityApplicationPortfolioFileDto) => {
    setFileCtx({ sectionId });
    setEditingFile(f);
    const type = (f.type as UniversityApplicationPortfolioFileUpsertRequestDtoType) ?? "OTHER";
    setFileAddMode(type === "LINK" ? "link" : "file");
    setFileForm({
      type,
      name: f.name ?? "",
      description: f.description ?? "",
      fileUrl: f.fileUrl ?? "",
    });
    setFileOpen(true);
  };

  const handlePortfolioFileUploaded = (meta: { contentType: string | null; originalFilename: string | null }) => {
    const inferred = inferPortfolioFileType({
      contentType: meta.contentType,
      filename: meta.originalFilename,
    });
    setFileForm((s) => ({
      ...s,
      type: inferred,
      name: s.name.trim() ? s.name : (meta.originalFilename ?? s.name),
    }));
  };

  const submitFile = async () => {
    if (!data?.id || !fileCtx?.sectionId) return;
    const resolvedType: UniversityApplicationPortfolioFileUpsertRequestDtoType =
      fileAddMode === "link" ? "LINK" : (fileForm.type ?? inferPortfolioFileType({ url: fileForm.fileUrl }));
    setBusy(true);
    try {
      const body = JSON.stringify({
        type: resolvedType,
        name: fileForm.name || null,
        description: fileForm.description || null,
        fileUrl: fileForm.fileUrl || null,
      });
      if (editingFile?.id) {
        await apiJson(
          `/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/portfolio-sections/${encodeURIComponent(String(fileCtx.sectionId))}/files/${encodeURIComponent(String(editingFile.id))}`,
          { method: "PATCH", body },
        );
        toast.success({ title: "Güncellendi", description: "Dosya güncellendi." });
      } else {
        await apiJson(
          `/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/portfolio-sections/${encodeURIComponent(String(fileCtx.sectionId))}/files`,
          { method: "POST", body },
        );
        toast.success({ title: "Eklendi", description: "Dosya eklendi." });
      }
      setFileOpen(false);
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "İşlem başarısız" });
    } finally {
      setBusy(false);
    }
  };

  const deleteFile = async (sectionId: string, fileId: string) => {
    if (!data?.id) return;
    setBusy(true);
    try {
      await apiJson(
        `/api/proxy/v1/admin/university-applications/${encodeURIComponent(String(data.id))}/portfolio-sections/${encodeURIComponent(sectionId)}/files/${encodeURIComponent(fileId)}`,
        { method: "DELETE" },
      );
      toast.success({ title: "Silindi", description: "Dosya silindi." });
      await reload();
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "Silinemedi" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Başvurular"
        title={title}
        description={
          error ? (
            <span className="text-[var(--danger-600)]">{error}</span>
          ) : isCreate ? (
            "Başvuru sahibini seçin veya yeni USER hesabı oluşturun; ardından başvuru bilgilerini doldurup taslak kaydı açın."
          ) : (
            "Başvuru detaylarını görüntüleyin ve yönetin."
          )
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!isCreate && data?.status ? (
              <div className="w-48">
                <Select<ApplicationStatus>
                  size="sm"
                  value={data.status}
                  disabled={loading || busy}
                  onChange={(v) => v && void changeApplicationStatus(v)}
                  options={
                    APPLICATION_STATUS_OPTIONS as unknown as {
                      value: ApplicationStatus;
                      label: string;
                    }[]
                  }
                />
              </div>
            ) : null}
            <Button variant="secondary" onClick={() => router.push("/admin/university-applications")}>
              Geri
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Icon name="arrow-up-down" size={16} />}
              onClick={() => void reload()}
              disabled={busy}
            >
              Yenile
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex max-h-[min(85vh,920px)] flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-subtle)] bg-[var(--surface-0)]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] p-5">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Tekil Alanlar</div>
            <div className="flex items-center gap-2">
              {data?.status ? <Badge variant={statusVariant(data.status)} dot>{statusLabel(data.status)}</Badge> : null}
              {!isCreate || data ? (
                <Button size="sm" variant="secondary" onClick={openScalarEdit} disabled={!data || loading}>
                  Güncelle
                </Button>
              ) : (
                <Button size="sm" variant="primary" onClick={openCreateApplicationModal} disabled={loading}>
                  Taslak oluştur
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-5 text-sm text-[var(--text-tertiary)]">Yükleniyor…</div>
          ) : !data ? (
            <div className="space-y-3 p-5 text-sm text-[var(--text-tertiary)]">
              {isCreate ? (
                <>
                  <p>
                    Yeni başvuru için taslak oluşturun. Formda mevcut bir USER seçebilir veya e-posta ve parola ile yeni
                    kullanıcı açabilirsiniz; ardından başvuru bilgilerini doldurup kaydedin.
                  </p>
                  <Button size="sm" variant="secondary" onClick={openCreateApplicationModal}>
                    Taslak oluştur
                  </Button>
                </>
              ) : (
                <span>Kayıt bulunamadı.</span>
              )}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Başvuru sahibi"
                  value={(() => {
                    const d = data as UniversityApplicationDetailWithApplicant;
                    if (d.applicantEmail) {
                      return d.applicantUserId ? `${d.applicantEmail} ` : d.applicantEmail;
                    }
                    return "-";
                  })()}
                />
                <Field label="Ad" value={data.firstName ?? "-"} />
                <Field label="Soyad" value={data.lastName ?? "-"} />
                <Field
                  label="Doğum tarihi"
                  value={data.birthDate ? isoLocalDateToTr(data.birthDate) || data.birthDate : "-"}
                />
                <Field label="Telefon" value={data.phone ?? "-"} />
                <Field label="Uyruk" value={data.nationality ?? "-"} />
                <Field label="Mevcut okul" value={data.currentSchool ?? "-"} />
                <div className="sm:col-span-2">
                  <Field label="Adres" value={data.address ?? "-"} />
                </div>
                <Field label="Öğrenci" value={boolTr(data.student)} />
                <Field label="Danışmanlık" value={boolTr(data.consultancy)} />
                <Field label="Sınıf seviyesi" value={data.classLevel ?? "-"} />
                <Field label="Referans kişi" value={data.referencePerson ?? "-"} />
                <Field label="Takip eden kişi" value={data.followerPerson ?? "-"} />
                <Field label="Eğitim seviyesi" value={educationLevelTr(data.educationLevel)} />
                <Field label="Başlangıç dönemi" value={startTermTr(data.startTermSeason)} />
                <Field label="Başlangıç yılı" value={data.startYear != null ? String(data.startYear) : "-"} />
                <Field
                  label="Yıllık bütçe (minimum)"
                  value={
                    data.yearlyBudgetMin != null && Number.isFinite(Number(data.yearlyBudgetMin))
                      ? numberToTrMoney(Number(data.yearlyBudgetMin))
                      : "-"
                  }
                />
                <Field
                  label="Yıllık bütçe (maksimum)"
                  value={
                    data.yearlyBudgetMax != null && Number.isFinite(Number(data.yearlyBudgetMax))
                      ? numberToTrMoney(Number(data.yearlyBudgetMax))
                      : "-"
                  }
                />
                <Field label="Burs talebi" value={boolTr(data.scholarshipRequested)} />
                {data.scholarshipRequested ? <Field label="Burs tipi" value={data.scholarshipType ?? "-"} /> : null}
                <Field label="Konaklama" value={accommodationTr(data.accommodationType)} />
                <Field
                  label="Ücret tutarı"
                  value={
                    data.priceAmount != null && Number.isFinite(Number(data.priceAmount))
                      ? numberToTrMoney(Number(data.priceAmount))
                      : "-"
                  }
                /> 
                <Field label="Para birimi" value={currencyLabelTr(data.priceCurrency)} />
                <div className="sm:col-span-2">
                  <Field label="Notlar" value={data.notes ?? "-"} />
                </div>
                <Field label="Oluşturma" value={formatTrDateTime(data.createdAt)} />
                <Field label="Güncelleme" value={formatTrDateTime(data.updatedAt)} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <DetailRightAccordionItem
            id="notes"
            openId={openRightAccordion}
            onOpen={setOpenRightAccordion}
            title="Notlar"
            actions={
              <Button size="sm" variant="secondary" onClick={openAddNote} disabled={!data || loading}>
                Ekle
              </Button>
            }
          >
            {data?.applicationNotes?.length ? (
              <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
                {data.applicationNotes.map((n) => (
                  <li key={String(n.id ?? crypto.randomUUID())} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-[var(--text-primary)]">{n.todoText ?? "-"}</div>
                        <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                          {n.writtenBy ?? "-"} • {formatTrDateTime(n.writtenAt)}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEditNote(n)} disabled={busy}>
                          Düzenle
                        </Button>
                        {n.id ? (
                          <Button size="sm" variant="danger" onClick={() => void deleteNote(String(n.id))} disabled={busy}>
                            Sil
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-[var(--text-tertiary)]">Kayıt yok</div>
            )}
          </DetailRightAccordionItem>

          <DetailRightAccordionItem
            id="preferences"
            openId={openRightAccordion}
            onOpen={setOpenRightAccordion}
            title="Tercihler"
          >
            <div className="grid gap-3 pt-2">
              <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">Bölüm Tercihleri</div>
                  <Button size="sm" variant="secondary" onClick={() => openAddPref("department-preferences")} disabled={!data || loading}>
                    Ekle
                  </Button>
                </div>
                {(data?.departmentPreferences ?? []).length ? (
                  <ul className="mt-2 divide-y divide-[var(--border-subtle)]">
                    {(data?.departmentPreferences ?? []).map((v, idx) => (
                      <li key={`${idx}-${v}`} className="flex items-center justify-between gap-2 py-2">
                        <div className="min-w-0 truncate text-sm text-[var(--text-primary)]">{v}</div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEditPref("department-preferences", idx, v)} disabled={busy}>
                            Düzenle
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => void deletePref("department-preferences", idx)} disabled={busy}>
                            Sil
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2 text-sm text-[var(--text-tertiary)]">Kayıt yok</div>
                )}
              </div>

              <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">Ülke Tercihleri</div>
                  <Button size="sm" variant="secondary" onClick={() => openAddPref("country-preferences")} disabled={!data || loading}>
                    Ekle
                  </Button>
                </div>
                {(data?.countryPreferences ?? []).length ? (
                  <ul className="mt-2 divide-y divide-[var(--border-subtle)]">
                    {(data?.countryPreferences ?? []).map((v, idx) => (
                      <li key={`${idx}-${v}`} className="flex items-center justify-between gap-2 py-2">
                        <div className="min-w-0 truncate text-sm text-[var(--text-primary)]">{v}</div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEditPref("country-preferences", idx, v)} disabled={busy}>
                            Düzenle
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => void deletePref("country-preferences", idx)} disabled={busy}>
                            Sil
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2 text-sm text-[var(--text-tertiary)]">Kayıt yok</div>
                )}
              </div>

              <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">Üniversite Tercihleri</div>
                  <Button size="sm" variant="secondary" onClick={() => openAddPref("university-preferences")} disabled={!data || loading}>
                    Ekle
                  </Button>
                </div>
                {(data?.universityPreferences ?? []).length ? (
                  <ul className="mt-2 divide-y divide-[var(--border-subtle)]">
                    {(data?.universityPreferences ?? []).map((v, idx) => (
                      <li key={`${idx}-${v}`} className="flex items-center justify-between gap-2 py-2">
                        <div className="min-w-0 truncate text-sm text-[var(--text-primary)]">{v}</div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEditPref("university-preferences", idx, v)} disabled={busy}>
                            Düzenle
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => void deletePref("university-preferences", idx)} disabled={busy}>
                            Sil
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2 text-sm text-[var(--text-tertiary)]">Kayıt yok</div>
                )}
              </div>
            </div>
          </DetailRightAccordionItem>

          <DetailRightAccordionItem
            id="meetings"
            openId={openRightAccordion}
            onOpen={setOpenRightAccordion}
            title="Görüşmeler"
            actions={
              <Button size="sm" variant="secondary" onClick={openAddMeeting} disabled={!data || loading}>
                Ekle
              </Button>
            }
          >
            {data?.meetings?.length ? (
              <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
                {data.meetings.map((m) => (
                  <li key={String(m.id ?? crypto.randomUUID())} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--text-primary)]">{m.person ?? "-"}</div>
                        <div className="mt-1 text-xs text-[var(--text-tertiary)]">{formatTrDateTime(m.meetingAt)}</div>
                        {m.meetingNote ? <div className="mt-1 text-xs text-[var(--text-tertiary)]">{m.meetingNote}</div> : null}
                        {m.meetingResult ? <div className="mt-1 text-xs text-[var(--text-tertiary)]">Sonuç: {m.meetingResult}</div> : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEditMeeting(m)} disabled={busy}>
                          Düzenle
                        </Button>
                        {m.id ? (
                          <Button size="sm" variant="danger" onClick={() => void deleteMeeting(String(m.id))} disabled={busy}>
                            Sil
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-[var(--text-tertiary)]">Kayıt yok</div>
            )}
          </DetailRightAccordionItem>

          <DetailRightAccordionItem
            id="tasks"
            openId={openRightAccordion}
            onOpen={setOpenRightAccordion}
            title="Görevler"
            actions={
              <Button size="sm" variant="secondary" onClick={openAddTask} disabled={!data || loading}>
                Ekle
              </Button>
            }
          >
            {data?.tasks?.length ? (
              <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
                {data.tasks.map((t) => (
                  <li key={String(t.id ?? crypto.randomUUID())} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--text-primary)]">{t.whatToDo ?? "-"}</div>
                        <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                          {formatTrDateTime(t.scheduledAt)} • {t.status ?? "-"}
                        </div>
                        {t.withWhom ? <div className="mt-1 text-xs text-[var(--text-tertiary)]">Kiminle: {t.withWhom}</div> : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEditTask(t)} disabled={busy}>
                          Düzenle
                        </Button>
                        {t.id ? (
                          <Button size="sm" variant="danger" onClick={() => void deleteTask(String(t.id))} disabled={busy}>
                            Sil
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-[var(--text-tertiary)]">Kayıt yok</div>
            )}
          </DetailRightAccordionItem>

          <DetailRightAccordionItem
            id="payments"
            openId={openRightAccordion}
            onOpen={setOpenRightAccordion}
            title="Ödemeler"
            actions={
              <Button size="sm" variant="secondary" onClick={openAddPayment} disabled={!data || loading}>
                Ekle
              </Button>
            }
          >
            {data?.payments?.length ? (
              <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
                {data.payments.map((p) => (
                  <li key={String(p.id ?? crypto.randomUUID())} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {(p.amount ?? "-").toString()} {p.currency ?? ""}
                        </div>
                        <div className="mt-1 text-xs text-[var(--text-tertiary)]">{formatTrDateTime(p.paymentAt)}</div>
                        {p.receivedBy ? <div className="mt-1 text-xs text-[var(--text-tertiary)]">Alan: {p.receivedBy}</div> : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEditPayment(p)} disabled={busy}>
                          Düzenle
                        </Button>
                        {p.id ? (
                          <Button size="sm" variant="danger" onClick={() => void deletePayment(String(p.id))} disabled={busy}>
                            Sil
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-[var(--text-tertiary)]">Kayıt yok</div>
            )}
          </DetailRightAccordionItem>

          <DetailRightAccordionItem
            id="documents"
            openId={openRightAccordion}
            onOpen={setOpenRightAccordion}
            title="Dokümanlar"
            actions={
              <Button size="sm" variant="secondary" onClick={openAddDoc} disabled={loading || !data}>
                Ekle
              </Button>
            }
          >
            {data?.documents?.length ? (
              <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
                {data.documents.map((d) => (
                  <li key={String(d.id ?? crypto.randomUUID())} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {d.documentName ?? "Doküman"}
                          {d.required ? <span className="ml-2 text-xs text-[var(--danger-600)]">zorunlu</span> : null}
                        </div>
                        {d.documentDescription ? (
                          <div className="mt-1 text-xs text-[var(--text-tertiary)]">{d.documentDescription}</div>
                        ) : null}
                        {d.documentUrl ? (
                          <div className="mt-2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2">
                            <div className="aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-0)]">
                              <FilePreview
                                url={d.documentUrl}
                                filename={d.documentName ?? null}
                                className="h-full w-full"
                              />
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                              <a
                                href={d.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[var(--accent-700)] underline underline-offset-2"
                              >
                                Aç
                              </a>
                              <span className="text-[var(--text-tertiary)]">•</span>
                              <a
                                href={d.documentUrl}
                                download
                                className="text-[var(--accent-700)] underline underline-offset-2"
                              >
                                İndir
                              </a>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEditDoc(d)} disabled={busy}>
                          Düzenle
                        </Button>
                        {d.id ? (
                          <Button size="sm" variant="danger" onClick={() => void deleteDoc(String(d.id))} disabled={busy}>
                            Sil
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-[var(--text-tertiary)]">Kayıt yok</div>
            )}
          </DetailRightAccordionItem>

          <DetailRightAccordionItem
            id="portfolio"
            openId={openRightAccordion}
            onOpen={setOpenRightAccordion}
            title="Ek Materyaller"
            actions={
              <Button size="sm" variant="secondary" onClick={openAddSection} disabled={loading || !data}>
                Bölüm ekle
              </Button>
            }
          >
            {data?.portfolioSections?.length ? (
              <div className="mt-3 space-y-3">
                {data.portfolioSections.map((s) => (
                  <section
                    key={String(s.id ?? crypto.randomUUID())}
                    className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[var(--text-primary)]">
                          {s.sectionNameOverride ?? s.portfolioSection?.name ?? "Bölüm"}
                          {s.required ? <span className="ml-2 text-xs text-[var(--danger-600)]">zorunlu</span> : null}
                        </div>
                        {(s.sectionDescriptionOverride ?? s.portfolioSection?.description) ? (
                          <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                            {s.sectionDescriptionOverride ?? s.portfolioSection?.description}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openAddFile(String(s.id))} disabled={busy || !s.id}>
                          Dosya Ekle
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => openEditSection(s)} disabled={busy}>
                          Düzenle
                        </Button>
                        {s.id ? (
                          <Button size="sm" variant="danger" onClick={() => void deleteSection(String(s.id))} disabled={busy}>
                            Sil
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {s.files?.length ? (
                      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                        {s.files.map((f) => (
                          <li
                            key={String(f.id ?? crypto.randomUUID())}
                            className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-0)]"
                          >
                            <div className="aspect-[16/9] w-full overflow-hidden bg-[var(--surface-1)]">
                              <FilePreview
                                url={f.fileUrl ?? ""}
                                filename={f.name ?? null}
                                fileType={f.type ?? null}
                                className="h-full w-full"
                              />
                            </div>
                            <div className="p-3">
                              <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                                {f.name ?? "Dosya"}
                              </div>
                              {f.description ? (
                                <div className="mt-1 line-clamp-2 text-xs text-[var(--text-tertiary)]">{f.description}</div>
                              ) : null}
                              {f.fileUrl ? (
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                  <a
                                    href={f.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[var(--accent-700)] underline underline-offset-2"
                                  >
                                    Aç
                                  </a>
                                  <span className="text-[var(--text-tertiary)]">•</span>
                                  <a
                                    href={f.fileUrl}
                                    download
                                    className="text-[var(--accent-700)] underline underline-offset-2"
                                  >
                                    İndir
                                  </a>
                                </div>
                              ) : null}
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button size="sm" variant="secondary" onClick={() => openEditFile(String(s.id), f)} disabled={busy || !f.id}>
                                  Düzenle
                                </Button>
                                {f.id ? (
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => void deleteFile(String(s.id), String(f.id))}
                                    disabled={busy}
                                  >
                                    Sil
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-3 text-sm text-[var(--text-tertiary)]">Dosya yok</div>
                    )}
                  </section>
                ))}
              </div>
            ) : (
              <div className="text-sm text-[var(--text-tertiary)]">Bölüm yok</div>
            )}
          </DetailRightAccordionItem>
        </div>
      </div>

      <Modal
        open={docOpen}
        onClose={() => setDocOpen(false)}
        title={editingDoc ? "Doküman Güncelle" : "Doküman Ekle"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDocOpen(false)} disabled={busy}>
              Vazgeç
            </Button>
            <Button onClick={() => void submitDoc()} loading={busy}>
              Kaydet
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input
            label="Doküman adı"
            value={docForm.documentName}
            onChange={(e) => setDocForm((s) => ({ ...s, documentName: e.target.value }))}
            placeholder="Örn: Transkript"
          />
          <Textarea
            label="Açıklama"
            value={docForm.documentDescription}
            onChange={(e) => setDocForm((s) => ({ ...s, documentDescription: e.target.value }))}
            placeholder="İsteğe bağlı açıklama"
            rows={3}
          />
          <FileUploadInput
            label="Dosya"
            value={docForm.documentUrl}
            onChange={(v) => setDocForm((s) => ({ ...s, documentUrl: v }))}
            purpose="UNIVERSITY_APPLICATION_DOCUMENT"
            uploadUrl="/api/proxy/v1/admin/files"
            getDownloadUrl={(fileId) => `/api/proxy/v1/admin/files/${encodeURIComponent(fileId)}/download`}
          />
          <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={docForm.required}
              onChange={(e) => setDocForm((s) => ({ ...s, required: e.target.checked }))}
            />
            Zorunlu
          </label>
        </div>
      </Modal>

      <Modal
        open={sectionOpen}
        onClose={() => setSectionOpen(false)}
        title={editingSection ? "Ek materyal bölümünü güncelle" : "Ek materyal bölümü ekle"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSectionOpen(false)} disabled={busy}>
              Vazgeç
            </Button>
            <Button onClick={() => void submitSection()} loading={busy}>
              Kaydet
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input
            label="Özel başlık"
            value={sectionForm.sectionNameOverride}
            onChange={(e) => setSectionForm((s) => ({ ...s, sectionNameOverride: e.target.value }))}
            placeholder="Örn: Portfolyo"
          />
          <Textarea
            label="Özel açıklama"
            value={sectionForm.sectionDescriptionOverride}
            onChange={(e) => setSectionForm((s) => ({ ...s, sectionDescriptionOverride: e.target.value }))}
            placeholder="İsteğe bağlı"
            rows={3}
          />
          <Input
            label="Sıra numarası"
            inputMode="numeric"
            value={String(sectionForm.sortOrder)}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, "").slice(0, 6);
              setSectionForm((s) => ({ ...s, sortOrder: d === "" ? 0 : Number(d) }));
            }}
            hint="Yalnızca rakam (sıra)."
          />
          <Select<string>
            label="Katalog şablonu (isteğe bağlı)"
            placeholder="Şablon seçin"
            clearable
            value={sectionForm.portfolioSectionId || null}
            onChange={(v) => setSectionForm((s) => ({ ...s, portfolioSectionId: v ?? "" }))}
            options={catalogSectionOptions}
            hint={
              catalogSectionOptions.length === 0
                ? "Katalog boş. Şablonları Katalog → Ek Materyal Şablonları ekranından ekleyin."
                : "Şablon seçerseniz ad/açıklama katalogdan gelir; bu başvuruya özel override yapabilirsiniz."
            }
          />
          {catalogSectionOptions.length === 0 ? (
            <Link
              href="/admin/catalog?tab=portfolio-sections"
              className="text-sm font-medium text-[var(--accent-700)] underline underline-offset-2"
            >
              Ek materyal şablonlarını yönet →
            </Link>
          ) : null}
          <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={sectionForm.required}
              onChange={(e) => setSectionForm((s) => ({ ...s, required: e.target.checked }))}
            />
            Zorunlu
          </label>
        </div>
      </Modal>

      <Modal
        open={fileOpen}
        onClose={() => setFileOpen(false)}
        title={editingFile ? "Dosya Güncelle" : "Dosya Ekle"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFileOpen(false)} disabled={busy}>
              Vazgeç
            </Button>
            <Button onClick={() => void submitFile()} loading={busy}>
              Kaydet
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={fileAddMode === "file" ? "primary" : "secondary"}
              onClick={() => setFileAddMode("file")}
            >
              Dosya yükle
            </Button>
            <Button
              size="sm"
              variant={fileAddMode === "link" ? "primary" : "secondary"}
              onClick={() => {
                setFileAddMode("link");
                setFileForm((s) => ({ ...s, type: "LINK" }));
              }}
            >
              Bağlantı ekle
            </Button>
          </div>
          <Input
            label="Ad"
            value={fileForm.name}
            onChange={(e) => setFileForm((s) => ({ ...s, name: e.target.value }))}
            placeholder="Örn: Çalışma örneği"
          />
          <Textarea
            label="Açıklama"
            value={fileForm.description}
            onChange={(e) => setFileForm((s) => ({ ...s, description: e.target.value }))}
            placeholder="İsteğe bağlı"
            rows={3}
          />
          {fileAddMode === "link" ? (
            <Input
              label="Bağlantı URL"
              value={fileForm.fileUrl}
              onChange={(e) => setFileForm((s) => ({ ...s, fileUrl: e.target.value }))}
              placeholder="https://github.com/..."
            />
          ) : (
            <>
              <FileUploadInput
                label="Dosya"
                value={fileForm.fileUrl}
                onChange={(v) => setFileForm((s) => ({ ...s, fileUrl: v }))}
                onUploaded={handlePortfolioFileUploaded}
                purpose="UNIVERSITY_APPLICATION_PORTFOLIO"
                uploadUrl="/api/proxy/v1/admin/files"
                getDownloadUrl={(fileId) => `/api/proxy/v1/admin/files/${encodeURIComponent(fileId)}/download`}
              />
              {fileForm.fileUrl ? (
                <p className="text-xs text-[var(--text-tertiary)]">
                  Algılanan tür: {portfolioFileTypeLabelTr(fileForm.type)}
                </p>
              ) : null}
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={prefOpen}
        onClose={() => setPrefOpen(false)}
        title={prefEditingIndex === null ? "Listeye Ekle" : "Liste Elemanı Güncelle"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPrefOpen(false)} disabled={busy}>
              Vazgeç
            </Button>
            <Button onClick={() => void submitPref()} loading={busy} disabled={!prefKind}>
              Kaydet
            </Button>
          </>
        }
      >
        <Input label="Değer" value={prefValue} onChange={(e) => setPrefValue(e.target.value)} placeholder="Tercih metnini girin" />
      </Modal>

      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title={editingNote ? "Not Güncelle" : "Not Ekle"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setNoteOpen(false)} disabled={busy}>
              Vazgeç
            </Button>
            <Button onClick={() => void submitNote()} loading={busy}>
              Kaydet
            </Button>
          </>
        }
      >
        <Textarea label="Not metni" value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} />
      </Modal>

      <Modal
        open={meetingOpen}
        onClose={() => setMeetingOpen(false)}
        title={editingMeeting ? "Görüşme Güncelle" : "Görüşme Ekle"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMeetingOpen(false)} disabled={busy}>
              Vazgeç
            </Button>
            <Button onClick={() => void submitMeeting()} loading={busy}>
              Kaydet
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Kişi" required value={meetingForm.person} onChange={(e) => setMeetingForm((s) => ({ ...s, person: e.target.value }))} />
          </div>
          <Input
            label="Tarih"
            required
            inputMode="numeric"
            value={meetingForm.meetingDate}
            onChange={(e) => setMeetingForm((s) => ({ ...s, meetingDate: sanitizeTrDateDigitsInput(e.target.value) }))}
            placeholder="gg.aa.yyyy"
            hint="Yalnızca rakam; noktalar otomatik (Türkiye takvimi)."
          />
          <Input
            label="Saat"
            required
            inputMode="numeric"
            value={meetingForm.meetingTime}
            onChange={(e) => setMeetingForm((s) => ({ ...s, meetingTime: sanitizeTrTimeDigitsInput(e.target.value) }))}
            placeholder="SS:DD"
            hint="24 saat (örn. 15:30). Yalnızca rakam."
          />
          <div className="sm:col-span-2">
            <Textarea label="Görüşme notu" value={meetingForm.meetingNote} onChange={(e) => setMeetingForm((s) => ({ ...s, meetingNote: e.target.value }))} rows={3} />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Sonuç" value={meetingForm.meetingResult} onChange={(e) => setMeetingForm((s) => ({ ...s, meetingResult: e.target.value }))} rows={2} />
          </div>
        </div>
      </Modal>

      <Modal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        title={editingTask ? "Görev Güncelle" : "Görev Ekle"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTaskOpen(false)} disabled={busy}>
              Vazgeç
            </Button>
            <Button onClick={() => void submitTask()} loading={busy}>
              Kaydet
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Ne yapılacak?" required value={taskForm.whatToDo} onChange={(e) => setTaskForm((s) => ({ ...s, whatToDo: e.target.value }))} />
          </div>
          <Input
            label="Tarih"
            required
            inputMode="numeric"
            value={taskForm.scheduledDate}
            onChange={(e) => setTaskForm((s) => ({ ...s, scheduledDate: sanitizeTrDateDigitsInput(e.target.value) }))}
            placeholder="gg.aa.yyyy"
            hint="Yalnızca rakam; gg.aa.yyyy."
          />
          <Input
            label="Saat"
            required
            inputMode="numeric"
            value={taskForm.scheduledTime}
            onChange={(e) => setTaskForm((s) => ({ ...s, scheduledTime: sanitizeTrTimeDigitsInput(e.target.value) }))}
            placeholder="SS:DD"
            hint="24 saat. Yalnızca rakam."
          />
          <div className="sm:col-span-2">
            <Input label="Kiminle" required value={taskForm.withWhom} onChange={(e) => setTaskForm((s) => ({ ...s, withWhom: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Select<TaskStatus>
              label="Durum"
              placeholder="Seçiniz"
              value={taskForm.status ?? null}
              onChange={(v) => setTaskForm((s) => ({ ...s, status: (v ?? "PENDING") as TaskStatus }))}
              options={TASK_STATUS_FORM_OPTIONS}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title={editingPayment ? "Ödeme Güncelle" : "Ödeme Ekle"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaymentOpen(false)} disabled={busy}>
              Vazgeç
            </Button>
            <Button onClick={() => void submitPayment()} loading={busy}>
              Kaydet
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Ödeme tarihi"
              required
              inputMode="numeric"
              value={paymentForm.paymentDate}
              onChange={(e) => setPaymentForm((s) => ({ ...s, paymentDate: sanitizeTrDateDigitsInput(e.target.value) }))}
              placeholder="gg.aa.yyyy"
              hint="Yalnızca rakam. Saat istenmez; kayıt o günün başlangıcı (00:00, Türkiye saati) olarak saklanır."
            />
          </div>
          <Input
            label="Tutar"
            required
            inputMode="decimal"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm((s) => ({ ...s, amount: sanitizeTrMoneyInput(e.target.value) }))}
            onBlur={() => setPaymentForm((s) => ({ ...s, amount: finalizeTrMoneyOnBlur(s.amount) }))}
            placeholder="0,00"
            hint="Para formatı: rakam, binlik nokta, virgülle 2 ondalık."
          />
          <Select<ScalarCurrencyCode>
            label="Para birimi"
            required
            placeholder="Seçiniz"
            value={paymentForm.currency ? paymentForm.currency : null}
            onChange={(v) => setPaymentForm((s) => ({ ...s, currency: v ?? "" }))}
            options={SCALAR_CURRENCY_OPTIONS}
          />
          <div className="sm:col-span-2">
            <Input label="Teslim alan kişi" value={paymentForm.receivedBy} onChange={(e) => setPaymentForm((s) => ({ ...s, receivedBy: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <Modal
        open={scalarOpen}
        onClose={() => setScalarOpen(false)}
        title={isCreate ? "Yeni başvuru" : "Tekil Alanları Güncelle"}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setScalarOpen(false)} disabled={busy}>
              Vazgeç
            </Button>
            <Button onClick={() => void submitScalar()} loading={busy}>
              {isCreate ? "Oluştur" : "Kaydet"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {isCreate ? (
            <div className="lg:col-span-2 space-y-4 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Başvuru sahibi</div>
              <div className="flex flex-wrap gap-4 text-sm text-[var(--text-primary)]">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="applicantMode"
                    checked={applicantMode === "existing"}
                    onChange={() => {
                      setApplicantMode("existing");
                      setApplicantUserId(null);
                      setPinnedApplicantOption(null);
                      setApplicantIdentityLocked(false);
                      setNewApplicantEmail("");
                      setNewApplicantPassword("");
                      void fetchUserOptions("");
                    }}
                  />
                  Mevcut kullanıcı (USER)
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="applicantMode"
                    checked={applicantMode === "new"}
                    onChange={() => {
                      setApplicantMode("new");
                      setApplicantUserId(null);
                      setPinnedApplicantOption(null);
                      setApplicantIdentityLocked(false);
                      setNewApplicantEmail("");
                      setNewApplicantPassword("");
                    }}
                  />
                  Yeni kullanıcı
                </label>
              </div>
              {applicantMode === "existing" ? (
                <Select<string>
                  label="Kullanıcı"
                  required
                  placeholder="Seçiniz veya arayın…"
                  searchable
                  onSearch={(q) => void fetchUserOptions(q)}
                  loading={usersLoading}
                  options={mergedApplicantUserOptions}
                  value={applicantUserId}
                  onChange={(v) => {
                    setApplicantUserId(v);
                    if (!v) {
                      setPinnedApplicantOption(null);
                      setApplicantIdentityLocked(false);
                      setScalarForm((s) => ({
                        ...s,
                        firstName: "",
                        lastName: "",
                        birthDate: "",
                        phone: "",
                        nationality: "",
                        address: "",
                      }));
                      return;
                    }
                    void loadApplicantDetailForCreate(String(v));
                  }}
                  clearable
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="E-posta"
                    type="email"
                    autoComplete="off"
                    value={newApplicantEmail}
                    onChange={(e) => setNewApplicantEmail(e.target.value)}
                  />
                  <Input
                    label="Parola (en az 8 karakter)"
                    type="password"
                    autoComplete="new-password"
                    value={newApplicantPassword}
                    onChange={(e) => setNewApplicantPassword(e.target.value)}
                  />
                </div>
              )}
            </div>
          ) : null}
          <div className="lg:col-span-2 border-b border-[var(--border-subtle)] pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            Kimlik ve iletişim
          </div>
          {applicantIdentityFieldsReadOnly ? (
            <p className="lg:col-span-2 text-xs text-[var(--text-tertiary)]">
              Bu alanlar seçilen kullanıcının başvuru profilinden dolduruldu; yalnızca yeni kullanıcı veya profilsiz
              hesaplarda düzenlenebilir.
            </p>
          ) : null}
          <Input
            label="Ad"
            required
            readOnly={applicantIdentityFieldsReadOnly}
            value={scalarForm.firstName}
            error={scalarErrors.firstName}
            onChange={(e) => {
              setScalarErrors((er) => ({ ...er, firstName: undefined }));
              setScalarForm((s) => ({ ...s, firstName: e.target.value }));
            }}
          />
          <Input
            label="Soyad"
            required
            readOnly={applicantIdentityFieldsReadOnly}
            value={scalarForm.lastName}
            error={scalarErrors.lastName}
            onChange={(e) => {
              setScalarErrors((er) => ({ ...er, lastName: undefined }));
              setScalarForm((s) => ({ ...s, lastName: e.target.value }));
            }}
          />
          <Input
            label="Doğum tarihi"
            readOnly={applicantIdentityFieldsReadOnly}
            inputMode="numeric"
            value={scalarForm.birthDate}
            onChange={(e) => setScalarForm((s) => ({ ...s, birthDate: sanitizeTrDateDigitsInput(e.target.value) }))}
            placeholder="gg.aa.yyyy"
            hint="Yalnızca rakam; gg.aa.yyyy (örn. 09052001 → 09.05.2001)."
          />
          <Input
            label="Telefon"
            readOnly={applicantIdentityFieldsReadOnly}
            value={scalarForm.phone}
            onChange={(e) => setScalarForm((s) => ({ ...s, phone: e.target.value }))}
          />
          <Input
            label="Uyruk"
            readOnly={applicantIdentityFieldsReadOnly}
            value={scalarForm.nationality}
            onChange={(e) => setScalarForm((s) => ({ ...s, nationality: e.target.value }))}
          />
          <Input
            label="Mevcut okul"
            value={scalarForm.currentSchool}
            onChange={(e) => setScalarForm((s) => ({ ...s, currentSchool: e.target.value }))}
          />
          <div className="lg:col-span-2">
            <Textarea
              label="Adres"
              readOnly={applicantIdentityFieldsReadOnly}
              value={scalarForm.address}
              onChange={(e) => setScalarForm((s) => ({ ...s, address: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="lg:col-span-2 border-b border-[var(--border-subtle)] pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            Öğrencilik ve referanslar
          </div>
          <label className="flex items-center gap-2 pt-1 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={scalarForm.student}
              onChange={(e) => {
                const st = e.target.checked;
                setScalarForm((s) => ({ ...s, student: st, classLevel: st ? s.classLevel : "" }));
              }}
            />
            Öğrenci
          </label>
          <label className="flex items-center gap-2 pt-1 text-sm text-[var(--text-primary)]">
            <input type="checkbox" checked={scalarForm.consultancy} onChange={(e) => setScalarForm((s) => ({ ...s, consultancy: e.target.checked }))} />
            Danışmanlık
          </label>
          {scalarForm.student ? (
            <div className="lg:col-span-2">
              <Input
                label="Sınıf seviyesi"
                value={scalarForm.classLevel}
                onChange={(e) => setScalarForm((s) => ({ ...s, classLevel: e.target.value }))}
              />
            </div>
          ) : null}
          <Input label="Referans kişi" value={scalarForm.referencePerson} onChange={(e) => setScalarForm((s) => ({ ...s, referencePerson: e.target.value }))} />
          <Input label="Takip eden kişi" value={scalarForm.followerPerson} onChange={(e) => setScalarForm((s) => ({ ...s, followerPerson: e.target.value }))} />

          <div className="lg:col-span-2 border-b border-[var(--border-subtle)] pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            Eğitim planı
          </div>
          <Select<ScalarEducation>
            label="Eğitim seviyesi"
            placeholder="Seçiniz"
            required
            error={scalarErrors.educationLevel}
            value={scalarForm.educationLevel ? (scalarForm.educationLevel as ScalarEducation) : null}
            onChange={(v) => {
              setScalarErrors((prev) => ({ ...prev, educationLevel: undefined }));
              setScalarForm((s) => ({ ...s, educationLevel: v ?? "" }));
            }}
            options={SCALAR_EDUCATION_OPTIONS}
          />
          <Select<ScalarStartTerm>
            label="Başlangıç dönemi"
            placeholder="Seçiniz"
            clearable
            value={scalarForm.startTermSeason ? (scalarForm.startTermSeason as ScalarStartTerm) : null}
            onChange={(v) => setScalarForm((s) => ({ ...s, startTermSeason: v ?? "" }))}
            options={SCALAR_START_TERM_OPTIONS}
          />
          <Input
            label="Başlangıç yılı"
            value={scalarForm.startYear}
            onChange={(e) => setScalarForm((s) => ({ ...s, startYear: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
            placeholder="Örn: 2026"
            inputMode="numeric"
          />

          <div className="lg:col-span-2 border-b border-[var(--border-subtle)] pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            Yıllık bütçe
          </div>
          <Input
            label="Minimum"
            inputMode="decimal"
            value={scalarForm.yearlyBudgetMin}
            onChange={(e) => setScalarForm((s) => ({ ...s, yearlyBudgetMin: sanitizeTrMoneyInput(e.target.value) }))}
            onBlur={() =>
              setScalarForm((s) => ({ ...s, yearlyBudgetMin: finalizeTrMoneyOnBlur(s.yearlyBudgetMin) }))
            }
            placeholder="0,00"
            hint="Para formatı (ücret ile aynı): rakam, binlik nokta, virgülle 2 ondalık."
          />
          <Input
            label="Maksimum"
            inputMode="decimal"
            value={scalarForm.yearlyBudgetMax}
            onChange={(e) => setScalarForm((s) => ({ ...s, yearlyBudgetMax: sanitizeTrMoneyInput(e.target.value) }))}
            onBlur={() =>
              setScalarForm((s) => ({ ...s, yearlyBudgetMax: finalizeTrMoneyOnBlur(s.yearlyBudgetMax) }))
            }
            placeholder="0,00"
            hint="Para formatı (ücret ile aynı): rakam, binlik nokta, virgülle 2 ondalık."
          />

          <div className="lg:col-span-2 border-b border-[var(--border-subtle)] pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            Burs
          </div>
          <label className="flex items-center gap-2 pt-1 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={scalarForm.scholarshipRequested}
              onChange={(e) => {
                const checked = e.target.checked;
                setScalarForm((s) => ({
                  ...s,
                  scholarshipRequested: checked,
                  scholarshipType: checked ? s.scholarshipType : "",
                }));
              }}
            />
            Burs talep ediyor
          </label>
          {scalarForm.scholarshipRequested ? (
            <Input label="Burs tipi" value={scalarForm.scholarshipType} onChange={(e) => setScalarForm((s) => ({ ...s, scholarshipType: e.target.value }))} />
          ) : null}

          <div className="lg:col-span-2 border-b border-[var(--border-subtle)] pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            Konaklama ve ücret
          </div>
          <div className="lg:col-span-2">
            <Select<ScalarAccommodation>
              label="Konaklama türü"
              placeholder="Seçiniz"
              clearable
              value={scalarForm.accommodationType ? (scalarForm.accommodationType as ScalarAccommodation) : null}
              onChange={(v) => setScalarForm((s) => ({ ...s, accommodationType: v ?? "" }))}
              options={SCALAR_ACCOMMODATION_OPTIONS}
            />
          </div>
          <Input
            label="Ücret tutarı"
            inputMode="decimal"
            value={scalarForm.priceAmount}
            onChange={(e) => setScalarForm((s) => ({ ...s, priceAmount: sanitizeTrMoneyInput(e.target.value) }))}
            onBlur={() =>
              setScalarForm((s) => ({ ...s, priceAmount: finalizeTrMoneyOnBlur(s.priceAmount) }))
            }
            placeholder="0,00"
            hint="Sadece rakam; binlik ayraç nokta (.), ondalık virgül (,); virgülden sonra tam 2 hane."
          />
          <Select<ScalarCurrencyCode>
            label="Para birimi"
            placeholder="Seçiniz"
            clearable
            value={scalarForm.priceCurrency ? (scalarForm.priceCurrency as ScalarCurrencyCode) : null}
            onChange={(v) => setScalarForm((s) => ({ ...s, priceCurrency: v ?? "" }))}
            options={SCALAR_CURRENCY_OPTIONS}
          />

          <div className="lg:col-span-2 border-b border-[var(--border-subtle)] pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            Notlar
          </div>
          <div className="lg:col-span-2">
            <Textarea label="Notlar" value={scalarForm.notes} onChange={(e) => setScalarForm((s) => ({ ...s, notes: e.target.value }))} rows={3} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

