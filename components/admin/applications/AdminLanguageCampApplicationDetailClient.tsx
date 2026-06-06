"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  adminLanguageCampApplicationsChangeStatus,
  adminLanguageCampApplicationsPaymentsAdd,
  adminLanguageCampApplicationsPaymentsDelete,
  adminLanguageCampApplicationsPaymentsUpdate,
  adminLanguageCampApplicationsSetPaymentCompleted,
  ApplicationStatusChangeRequestDtoStatus,
  type LanguageCampApplicationDetailDto,
  type LanguageCampApplicationPaymentDto,
} from "@/lib/api/generated/index";
import { AdminLanguageCampApplicationCrmPanels } from "@/components/admin/applications/AdminLanguageCampApplicationCrmPanels";
import { AdminLanguageCampGroupPaymentsSummary } from "@/components/admin/applications/AdminLanguageCampGroupPaymentsSummary";
import { AdminLanguageCampParticipantTabs } from "@/components/admin/applications/AdminLanguageCampParticipantTabs";
import { AdminLanguageCampVisaFormSection } from "@/components/admin/applications/AdminLanguageCampVisaFormSection";
import { participantFullName } from "@/lib/applications/languageCampAdminGroups";
import {
  languageCampAdminBase,
  type LanguageCampApplicationDetailWithCrm,
} from "@/lib/applications/languageCampCrmTypes";
import { formatCampMoney, sumPaymentAmounts } from "@/lib/applications/languageCampDisplay";
import { formatTrDateTime, formatTrLocalDate } from "@/lib/dates/formatTr";
import { Button, Icon, Input, Modal, PageHeader, Select, Textarea, useToast } from "@/components/ui";

type ApplicationStatus = NonNullable<LanguageCampApplicationDetailDto["status"]>;

function statusLabel(status?: LanguageCampApplicationDetailDto["status"]) {
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

function categoryLabel(cat?: LanguageCampApplicationDetailDto["category"]) {
  switch (cat) {
    case "INDIVIDUAL":
      return "Bireysel";
    case "CORPORATE":
      return "Kurumsal";
    case "FAMILY":
      return "Aile";
    default:
      return cat ?? "-";
  }
}

function accommodationLabel(a?: LanguageCampApplicationDetailDto["accommodationType"]) {
  switch (a) {
    case "HOST_FAMILY":
      return "Aile yanı";
    case "DORMITORY":
      return "Yurt";
    case "PRIVATE":
      return "Özel konut";
    default:
      return a ?? "-";
  }
}

function paymentPreferenceLabel(p?: LanguageCampApplicationDetailDto["paymentPreference"]) {
  switch (p) {
    case "ONE_TIME":
      return "Tek sefer";
    case "INSTALLMENT":
      return "Taksit";
    default:
      return p ?? "-";
  }
}

function boolTr(v?: boolean) {
  if (v === true) return "Evet";
  if (v === false) return "Hayır";
  return "-";
}

function fullName(r: Pick<LanguageCampApplicationDetailDto, "firstName" | "lastName">) {
  const n = `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim();
  return n || null;
}

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

function isoLocalDateToTr(iso?: string | null): string {
  if (!iso) return "";
  const d0 = iso.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d0)) return "";
  const [y, m, d] = d0.split("-");
  return `${d}.${m}.${y}`;
}

function trDateToIso(
  tr: string,
  fieldLabel = "Tarih",
): { ok: true; iso: string | null } | { ok: false; message: string } {
  const s = tr.trim();
  if (!s) return { ok: true, iso: null };
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s);
  if (!m) {
    return { ok: false, message: `${fieldLabel} gg.aa.yyyy formatında olmalıdır.` };
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
    iso: `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}T00:00:00+03:00`,
  };
}

function sanitizeTrDateDigitsInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function numberToTrMoney(n: number): string {
  const [intRaw, frac] = n.toFixed(2).split(".");
  const intWithSep = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intWithSep},${frac}`;
}

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
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  const intRaw = v.slice(0, commaIdx).replace(/\D/g, "");
  const frac = v.slice(commaIdx + 1).replace(/\D/g, "").slice(0, 2);
  return `${intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${frac}`;
}

function finalizeTrMoneyOnBlur(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (!t.includes(",")) {
    const digits = t.replace(/\D/g, "");
    if (!digits) return "";
    return `${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},00`;
  }
  const lastComma = t.lastIndexOf(",");
  const intPart = t.slice(0, lastComma).replace(/\D/g, "");
  const frac = (t.slice(lastComma + 1).replace(/\D/g, "") + "00").slice(0, 2);
  return `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${frac}`;
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
  if (u === "TRY" || u === "TL") return "TRY";
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

type DetailRightAccordionId = "payments" | "visa";

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) {
    const msg = (data as unknown as { message?: string })?.message;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data;
}

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
          id={`lc-detail-acc-${id}`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[var(--text-tertiary)]" aria-hidden>
            <Icon name={open ? "chevron-down" : "chevron-right"} size={18} />
          </span>
          <span className="min-w-0">{title}</span>
        </button>
        {actions ? <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div> : null}
      </div>
      {open ? (
        <div
          className="border-t border-[var(--border-subtle)] px-4 pb-4 pt-1 sm:px-5 sm:pb-5"
          role="region"
          aria-labelledby={`lc-detail-acc-${id}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function AdminLanguageCampApplicationDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<LanguageCampApplicationDetailWithCrm | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [openRightAccordion, setOpenRightAccordion] = React.useState<DetailRightAccordionId>("payments");

  const [scalarOpen, setScalarOpen] = React.useState(false);
  const [scalarForm, setScalarForm] = React.useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    phone: "",
    isItSelf: false,
    numberOfApplicant: "",
    accommodationType: "" as LanguageCampApplicationDetailWithCrm["accommodationType"] | "",
    visaNeeded: false,
    visaFollowByGes: false,
    paymentPreference: "" as LanguageCampApplicationDetailWithCrm["paymentPreference"] | "",
    under18: false,
    parentFullName: "",
    parentPhoneNumber: "",
    parentEmailAddress: "",
    parentRelationship: "",
    userNotes: "",
    followerPerson: "",
    notes: "",
    priceAmount: "",
    priceCurrency: "" as ScalarCurrencyCode | "",
    emergencyFullName: "",
    emergencyPhone: "",
    emergencyRelationship: "",
  });

  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [editingPayment, setEditingPayment] = React.useState<LanguageCampApplicationPaymentDto | null>(null);
  const [paymentForm, setPaymentForm] = React.useState({
    paymentDate: "",
    amount: "",
    currency: "" as ScalarCurrencyCode | "",
    receivedBy: "",
  });

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(languageCampAdminBase(id), { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as LanguageCampApplicationDetailWithCrm & { message?: string };
      if (res.status >= 200 && res.status < 300) {
        setData(j);
      } else {
        setData(null);
        setError(j.message ?? `Detay yüklenemedi (HTTP ${res.status})`);
      }
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Detay yüklenemedi");
    }

    setLoading(false);
  }, [id]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const [statusBusyId, setStatusBusyId] = React.useState<string | null>(null);

  const changeParticipantStatus = React.useCallback(
    async (participantId: string, next: ApplicationStatus) => {
      const currentStatus =
        participantId === data?.id
          ? data?.status
          : data?.groupParticipants?.find((p) => p.id === participantId)?.status;
      if (!participantId || next === currentStatus) return;

      setStatusBusyId(participantId);
      setBusy(true);
      try {
        const res = await adminLanguageCampApplicationsChangeStatus(participantId, { status: next }).catch(
          (e: unknown) => ({
            status: 0,
            data: null,
            error: e instanceof Error ? e.message : "İstek başarısız",
          }),
        );

        if (res.status >= 200 && res.status < 300 && res.data) {
          if (participantId === id) {
            setData(res.data as LanguageCampApplicationDetailWithCrm);
          } else {
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    groupParticipants: prev.groupParticipants?.map((p) =>
                      p.id === participantId ? { ...p, status: next } : p,
                    ),
                  }
                : prev,
            );
          }
          toastRef.current.success({ title: "Durum güncellendi", description: statusLabel(next) });
        } else {
          toastRef.current.error({
            title: "Durum güncellenemedi",
            description: (res as { error?: string }).error ?? `İstek başarısız (HTTP ${res.status})`,
          });
        }
      } finally {
        setStatusBusyId(null);
        setBusy(false);
      }
    },
    [data?.groupParticipants, data?.id, data?.status, id],
  );

  const changeApplicationStatus = React.useCallback(
    async (next: ApplicationStatus) => {
      if (!data?.id) return;
      await changeParticipantStatus(data.id, next);
    },
    [changeParticipantStatus, data?.id],
  );

  const togglePaymentCompleted = async (next: boolean) => {
    if (!data?.id) return;
    setBusy(true);
    try {
      const res = await adminLanguageCampApplicationsSetPaymentCompleted(data.id, { paymentCompleted: next }).catch(
        (e: unknown) => ({
          status: 0,
          data: null,
          error: e instanceof Error ? e.message : "İstek başarısız",
        }),
      );

      if (res.status >= 200 && res.status < 300 && res.data) {
        await reload();
        toastRef.current.success({
          title: "Ödeme durumu güncellendi",
          description: next ? "Ödeme tamamlandı olarak işaretlendi." : "Ödeme tamamlanmadı olarak işaretlendi.",
        });
      } else {
        toastRef.current.error({
          title: "Güncellenemedi",
          description: (res as { error?: string }).error ?? `İstek başarısız (HTTP ${res.status})`,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const openAddPayment = () => {
    setOpenRightAccordion("payments");
    setEditingPayment(null);
    setPaymentForm({
      paymentDate: "",
      amount: "",
      currency: normalizeCurrencyForForm(data?.priceCurrency) ?? "",
      receivedBy: "",
    });
    setPaymentOpen(true);
  };

  const openEditPayment = (p: LanguageCampApplicationPaymentDto) => {
    setEditingPayment(p);
    setPaymentForm({
      paymentDate: p.paymentAt ? isoLocalDateToTr(p.paymentAt) : "",
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
      const when = trDateToIso(paymentForm.paymentDate, "Ödeme tarihi");
      if (!when.ok) {
        toast.error({ title: "Geçersiz tarih", description: when.message });
        setBusy(false);
        return;
      }
      if (!when.iso) {
        toast.error({ title: "Eksik bilgi", description: "Ödeme tarihi zorunludur." });
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

      const body = {
        paymentAt: when.iso,
        amount: Number(amountParsed.value),
        currency: cur,
        receivedBy: paymentForm.receivedBy.trim() || undefined,
      };

      const res = editingPayment?.id
        ? await adminLanguageCampApplicationsPaymentsUpdate(data.id, editingPayment.id, body).catch((e: unknown) => ({
            status: 0,
            data: null,
            error: e instanceof Error ? e.message : "İstek başarısız",
          }))
        : await adminLanguageCampApplicationsPaymentsAdd(data.id, body).catch((e: unknown) => ({
            status: 0,
            data: null,
            error: e instanceof Error ? e.message : "İstek başarısız",
          }));

      if (res.status >= 200 && res.status < 300 && res.data) {
        setPaymentOpen(false);
        await reload();
        toast.success({
          title: editingPayment ? "Güncellendi" : "Eklendi",
          description: editingPayment ? "Ödeme güncellendi." : "Ödeme eklendi.",
        });
      } else {
        toast.error({
          title: "Hata",
          description: (res as { error?: string }).error ?? `İstek başarısız (HTTP ${res.status})`,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const deletePayment = async (paymentId: string) => {
    if (!data?.id) return;
    setBusy(true);
    try {
      const res = await adminLanguageCampApplicationsPaymentsDelete(data.id, paymentId).catch((e: unknown) => ({
        status: 0,
        data: null,
        error: e instanceof Error ? e.message : "İstek başarısız",
      }));

      if (res.status >= 200 && res.status < 300 && res.data) {
        await reload();
        toast.success({ title: "Silindi", description: "Ödeme silindi." });
      } else {
        toast.error({
          title: "Silinemedi",
          description: (res as { error?: string }).error ?? `İstek başarısız (HTTP ${res.status})`,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const openScalarEdit = () => {
    if (!data) return;
    setScalarForm({
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      birthDate: isoLocalDateToTr(data.birthDate),
      phone: data.phone ?? "",
      isItSelf: !!data.isItSelf,
      numberOfApplicant: data.numberOfApplicant != null ? String(data.numberOfApplicant) : "",
      accommodationType: data.accommodationType ?? "",
      visaNeeded: !!data.visaNeeded,
      visaFollowByGes: !!data.visaFollowByGes,
      paymentPreference: data.paymentPreference ?? "",
      under18: !!data.under18,
      parentFullName: data.parentFullName ?? "",
      parentPhoneNumber: data.parentPhoneNumber ?? "",
      parentEmailAddress: data.parentEmailAddress ?? "",
      parentRelationship: data.parentRelationship ?? "",
      userNotes: data.userNotes ?? "",
      followerPerson: data.followerPerson ?? "",
      notes: data.notes ?? "",
      priceAmount:
        data.priceAmount != null && Number.isFinite(Number(data.priceAmount))
          ? numberToTrMoney(Number(data.priceAmount))
          : "",
      priceCurrency: normalizeCurrencyForForm(data.priceCurrency) ?? "",
      emergencyFullName: data.emergencyContact?.fullName ?? "",
      emergencyPhone: data.emergencyContact?.phone ?? "",
      emergencyRelationship: data.emergencyContact?.relationship ?? "",
    });
    setScalarOpen(true);
  };

  const submitScalar = async () => {
    if (!data?.id) return;
    setBusy(true);
    try {
      const birthParsed = scalarForm.birthDate.trim()
        ? trDateToIso(scalarForm.birthDate, "Doğum tarihi")
        : { ok: true as const, iso: null as string | null };
      if (!birthParsed.ok) {
        toast.error({ title: "Geçersiz tarih", description: birthParsed.message });
        setBusy(false);
        return;
      }
      const birthDateApi = birthParsed.iso ? birthParsed.iso.slice(0, 10) : null;
      const amountParsed = scalarForm.priceAmount.trim()
        ? trMoneyToApiDecimal(scalarForm.priceAmount, "Ücret tutarı")
        : { ok: true as const, value: "" };
      if (!amountParsed.ok) {
        toast.error({ title: "Geçersiz tutar", description: amountParsed.message });
        setBusy(false);
        return;
      }

      await apiJson(languageCampAdminBase(data.id), {
        method: "PATCH",
        body: JSON.stringify({
          firstName: scalarForm.firstName.trim() || null,
          lastName: scalarForm.lastName.trim() || null,
          birthDate: birthDateApi,
          phone: scalarForm.phone.trim() || null,
          isItSelf: scalarForm.isItSelf,
          numberOfApplicant: scalarForm.numberOfApplicant.trim()
            ? Number(scalarForm.numberOfApplicant)
            : null,
          accommodationType: scalarForm.accommodationType || null,
          visaNeeded: scalarForm.visaNeeded,
          visaFollowByGes: scalarForm.visaFollowByGes,
          paymentPreference: scalarForm.paymentPreference || null,
          under18: scalarForm.under18,
          parentFullName: scalarForm.parentFullName.trim() || null,
          parentPhoneNumber: scalarForm.parentPhoneNumber.trim() || null,
          parentEmailAddress: scalarForm.parentEmailAddress.trim() || null,
          parentRelationship: scalarForm.parentRelationship.trim() || null,
          userNotes: scalarForm.userNotes.trim() || null,
          followerPerson: scalarForm.followerPerson.trim() || null,
          notes: scalarForm.notes.trim() || null,
          priceAmount: amountParsed.value ? Number(amountParsed.value) : null,
          priceCurrency: scalarForm.priceCurrency || null,
          emergencyContact: {
            fullName: scalarForm.emergencyFullName.trim() || null,
            phone: scalarForm.emergencyPhone.trim() || null,
            relationship: scalarForm.emergencyRelationship.trim() || null,
          },
        }),
      });
      setScalarOpen(false);
      await reload();
      toast.success({ title: "Güncellendi", description: "Başvuru bilgileri kaydedildi." });
    } catch (e) {
      toast.error({ title: "Hata", description: e instanceof Error ? e.message : "Kaydedilemedi" });
    } finally {
      setBusy(false);
    }
  };

  const participantCount = data?.participantCount ?? data?.groupParticipants?.length ?? 1;
  const participantIndex = data?.participantIndex ?? 1;
  const title = data
    ? participantCount > 1
      ? `${fullName(data) ?? "Katılımcı"} (${participantIndex}/${participantCount})`
      : (fullName(data) ?? "Dil Kampı Başvurusu")
    : "Dil Kampı Başvurusu";
  const paidTotal = data ? sumPaymentAmounts(data.payments, data.priceCurrency) : 0;
  const ec = data?.emergencyContact;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Başvurular"
        title={title}
        description={
          error ? (
            <span className="text-[var(--danger-600)]">{error}</span>
          ) : data && participantCount > 1 ? (
            <>
              {data.languageCampProjectTitle ?? "Dil kampı"} · {participantCount} katılımcı
              {data.applicantDisplayName || data.applicantEmail ? (
                <>
                  {" "}
                  · Başvuran: {data.applicantDisplayName ?? data.applicantEmail}
                </>
              ) : null}
            </>
          ) : (
            "Dil kampı başvuru detaylarını görüntüleyin ve yönetin."
          )
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {data?.status ? (
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
            <Button variant="secondary" onClick={() => router.push("/admin/language-camp-applications")}>
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

      {data && participantCount > 1 ? (
        <AdminLanguageCampParticipantTabs
          activeId={id}
          participants={data.groupParticipants}
          participantCount={participantCount}
          applicantDisplayName={data.applicantDisplayName}
          applicantEmail={data.applicantEmail}
          projectTitle={data.languageCampProjectTitle}
          statusOptions={
            APPLICATION_STATUS_OPTIONS as unknown as {
              value: ApplicationStatus;
              label: string;
            }[]
          }
          onStatusChange={(participantId, status) => void changeParticipantStatus(participantId, status)}
          statusBusyId={statusBusyId}
        />
      ) : null}

      {data && participantCount > 1 ? (
        <AdminLanguageCampGroupPaymentsSummary participants={data.groupParticipants} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex max-h-[min(85vh,920px)] flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-subtle)] bg-[var(--surface-0)]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] p-5">
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {participantCount > 1
                ? `Katılımcı: ${participantFullName(data ?? {})}`
                : "Başvuru Bilgileri"}
            </div>
            <div className="flex items-center gap-2">
              {data?.status ? (
                <div className="w-48">
                  <Select<ApplicationStatus>
                    size="sm"
                    value={data.status}
                    disabled={loading || busy || statusBusyId === data.id}
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
              <Button size="sm" variant="secondary" onClick={openScalarEdit} disabled={!data || loading}>
                Güncelle
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="p-5 text-sm text-[var(--text-tertiary)]">Yükleniyor…</div>
          ) : !data ? (
            <div className="p-5 text-sm text-[var(--text-tertiary)]">Kayıt bulunamadı.</div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
              <div className="grid gap-6">
                <section className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                    Genel
                  </div>
                  <Field label="ID" value={<span className="font-mono text-xs">{data.id ?? "-"}</span>} />
                  <Field label="Kategori" value={categoryLabel(data.category)} />
                  {(data.applicantDisplayName || data.applicantEmail) && participantCount > 1 ? (
                    <>
                      <Field label="Başvuran" value={data.applicantDisplayName ?? "-"} />
                      <Field label="Başvuran e-posta" value={data.applicantEmail ?? "-"} />
                    </>
                  ) : null}
                  {participantCount > 1 ? (
                    <Field
                      label="Katılımcı sırası"
                      value={`${participantIndex} / ${participantCount}`}
                    />
                  ) : null}
                  <Field label="Takip eden" value={data.followerPerson ?? "-"} />
                  <Field label="Admin notları" value={data.notes ?? "-"} />
                  <Field label="Oluşturma" value={formatTrDateTime(data.createdAt)} />
                  <Field label="Güncelleme" value={formatTrDateTime(data.updatedAt)} />
                  <Field label="KVKK onayı" value={formatTrDateTime(data.kvkkAcceptedAt)} />
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                    Kişisel
                  </div>
                  <Field label="Ad" value={data.firstName ?? "-"} />
                  <Field label="Soyad" value={data.lastName ?? "-"} />
                  <Field
                    label="Doğum tarihi"
                    value={data.birthDate ? formatTrLocalDate(data.birthDate) : "-"}
                  />
                  <Field label="Telefon" value={data.phone ?? "-"} />
                  <Field label="Kendisi mi?" value={boolTr(data.isItSelf)} />
                  <Field
                    label="Başvuran sayısı"
                    value={data.numberOfApplicant != null ? String(data.numberOfApplicant) : "-"}
                  />
                  <Field label="18 yaş altı" value={boolTr(data.under18)} />
                  <div className="sm:col-span-2">
                    <Field label="Kullanıcı notları" value={data.userNotes ?? "-"} />
                  </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                    Kamp
                  </div>
                  <Field
                    label="Proje"
                    value={
                      data.languageCampProjectId ? (
                        <Link
                          href={`/admin/language-camp-projects/${encodeURIComponent(data.languageCampProjectId)}`}
                          className="text-[var(--accent-700)] underline underline-offset-2"
                        >
                          {data.languageCampProjectTitle ?? data.languageCampProjectId}
                        </Link>
                      ) : (
                        data.languageCampProjectTitle ?? "-"
                      )
                    }
                  />
                  <Field
                    label="Proje ID"
                    value={
                      <span className="font-mono text-xs">{data.languageCampProjectId ?? "-"}</span>
                    }
                  />
                  <Field label="Konaklama" value={accommodationLabel(data.accommodationType)} />
                  <Field label="Vize gerekli" value={boolTr(data.visaNeeded)} />
                  <Field label="Vize GES takibi" value={boolTr(data.visaFollowByGes)} />
                  <Field label="Ödeme tercihi" value={paymentPreferenceLabel(data.paymentPreference)} />
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                    Acil durum
                  </div>
                  <Field label="Ad soyad" value={ec?.fullName ?? "-"} />
                  <Field label="Telefon" value={ec?.phone ?? "-"} />
                  <Field label="Yakınlık" value={ec?.relationship ?? "-"} />
                </section>

                {(data.under18 ||
                  data.parentFullName ||
                  data.parentPhoneNumber ||
                  data.parentEmailAddress ||
                  data.parentRelationship) && (
                  <section className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                      Veli
                    </div>
                    <Field label="Veli ad soyad" value={data.parentFullName ?? "-"} />
                    <Field label="Veli telefon" value={data.parentPhoneNumber ?? "-"} />
                    <Field label="Veli e-posta" value={data.parentEmailAddress ?? "-"} />
                    <Field label="Yakınlık" value={data.parentRelationship ?? "-"} />
                  </section>
                )}

                {(data.company || data.companyId) && (
                  <section className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                      Şirket
                    </div>
                    <Field label="Şirket adı" value={data.company?.name ?? "-"} />
                    <Field label="Şirket kodu" value={data.company?.code ?? "-"} />
                    <Field
                      label="Şirket ID"
                      value={<span className="font-mono text-xs">{data.companyId ?? data.company?.id ?? "-"}</span>}
                    />
                  </section>
                )}

                <section className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                    Ücret özeti
                  </div>
                  <Field
                    label="Beklenen tutar"
                    value={formatCampMoney(data.priceAmount, data.priceCurrency, "tr") ?? "-"}
                  />
                  <Field label="Para birimi" value={currencyLabelTr(data.priceCurrency)} />
                  <Field
                    label="Ödenen toplam"
                    value={formatCampMoney(paidTotal, data.priceCurrency, "tr") ?? "-"}
                  />
                  <Field label="Ödeme tamamlandı" value={boolTr(data.paymentCompleted)} />
                </section>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <AdminLanguageCampApplicationCrmPanels
            applicationId={id}
            data={data}
            loading={loading}
            onReload={reload}
          />

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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">Ödeme tamamlandı</div>
                <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Beklenen: {formatCampMoney(data?.priceAmount, data?.priceCurrency, "tr") ?? "-"} · Ödenen:{" "}
                  {formatCampMoney(paidTotal, data?.priceCurrency, "tr") ?? "-"}
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--border-subtle)]"
                  checked={!!data?.paymentCompleted}
                  disabled={!data || busy}
                  onChange={(e) => void togglePaymentCompleted(e.target.checked)}
                />
                Tamamlandı
              </label>
            </div>

            {data?.payments?.length ? (
              <ul className="divide-y divide-[var(--border-subtle)]">
                {data.payments.map((p) => (
                  <li key={String(p.id ?? crypto.randomUUID())} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {p.amount != null ? numberToTrMoney(Number(p.amount)) : "-"} {p.currency ?? ""}
                        </div>
                        <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                          {formatTrDateTime(p.paymentAt)}
                        </div>
                        {p.receivedBy ? (
                          <div className="mt-1 text-xs text-[var(--text-tertiary)]">Alan: {p.receivedBy}</div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEditPayment(p)} disabled={busy}>
                          Düzenle
                        </Button>
                        {p.id ? (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => void deletePayment(String(p.id))}
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
              <div className="text-sm text-[var(--text-tertiary)]">Kayıt yok</div>
            )}
          </DetailRightAccordionItem>

          <DetailRightAccordionItem
            id="visa"
            openId={openRightAccordion}
            onOpen={setOpenRightAccordion}
            title="Vize Formu"
          >
            {data?.id ? (
              <AdminLanguageCampVisaFormSection
                applicationId={data.id}
                initialVisaForm={data.visaForm}
                onChanged={() => void reload()}
              />
            ) : (
              <div className="text-sm text-[var(--text-tertiary)]">Kayıt yok</div>
            )}
          </DetailRightAccordionItem>
        </div>
      </div>

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
              hint="Yalnızca rakam. Kayıt o günün başlangıcı (00:00, Türkiye saati) olarak saklanır."
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
            <Input
              label="Teslim alan kişi"
              value={paymentForm.receivedBy}
              onChange={(e) => setPaymentForm((s) => ({ ...s, receivedBy: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={scalarOpen}
        onClose={() => setScalarOpen(false)}
        title="Başvuru Bilgilerini Güncelle"
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setScalarOpen(false)} disabled={busy}>
              Vazgeç
            </Button>
            <Button onClick={() => void submitScalar()} loading={busy}>
              Kaydet
            </Button>
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Input label="Ad" value={scalarForm.firstName} onChange={(e) => setScalarForm((s) => ({ ...s, firstName: e.target.value }))} />
          <Input label="Soyad" value={scalarForm.lastName} onChange={(e) => setScalarForm((s) => ({ ...s, lastName: e.target.value }))} />
          <Input label="Doğum tarihi" inputMode="numeric" value={scalarForm.birthDate} onChange={(e) => setScalarForm((s) => ({ ...s, birthDate: sanitizeTrDateDigitsInput(e.target.value) }))} placeholder="gg.aa.yyyy" />
          <Input label="Telefon" value={scalarForm.phone} onChange={(e) => setScalarForm((s) => ({ ...s, phone: e.target.value }))} />
          <Input label="Başvuran sayısı" inputMode="numeric" value={scalarForm.numberOfApplicant} onChange={(e) => setScalarForm((s) => ({ ...s, numberOfApplicant: e.target.value.replace(/\D/g, "") }))} />
          <Input label="Takip eden kişi" value={scalarForm.followerPerson} onChange={(e) => setScalarForm((s) => ({ ...s, followerPerson: e.target.value }))} />
          <Select label="Konaklama" placeholder="Seçiniz" clearable value={scalarForm.accommodationType || null} onChange={(v) => setScalarForm((s) => ({ ...s, accommodationType: v ?? "" }))} options={[
            { value: "HOST_FAMILY", label: "Aile yanı" },
            { value: "DORMITORY", label: "Yurt" },
            { value: "PRIVATE", label: "Özel konut" },
          ]} />
          <Select label="Ödeme tercihi" placeholder="Seçiniz" clearable value={scalarForm.paymentPreference || null} onChange={(v) => setScalarForm((s) => ({ ...s, paymentPreference: v ?? "" }))} options={[
            { value: "ONE_TIME", label: "Tek sefer" },
            { value: "INSTALLMENT", label: "Taksit" },
          ]} />
          <Input label="Ücret tutarı" inputMode="decimal" value={scalarForm.priceAmount} onChange={(e) => setScalarForm((s) => ({ ...s, priceAmount: sanitizeTrMoneyInput(e.target.value) }))} onBlur={() => setScalarForm((s) => ({ ...s, priceAmount: finalizeTrMoneyOnBlur(s.priceAmount) }))} />
          <Select<ScalarCurrencyCode> label="Para birimi" placeholder="Seçiniz" value={scalarForm.priceCurrency || null} onChange={(v) => setScalarForm((s) => ({ ...s, priceCurrency: v ?? "" }))} options={SCALAR_CURRENCY_OPTIONS} />
          <div className="lg:col-span-2 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={scalarForm.isItSelf} onChange={(e) => setScalarForm((s) => ({ ...s, isItSelf: e.target.checked }))} /> Kendisi</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={scalarForm.visaNeeded} onChange={(e) => setScalarForm((s) => ({ ...s, visaNeeded: e.target.checked }))} /> Vize gerekli</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={scalarForm.visaFollowByGes} onChange={(e) => setScalarForm((s) => ({ ...s, visaFollowByGes: e.target.checked }))} /> Vize GES takibi</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={scalarForm.under18} onChange={(e) => setScalarForm((s) => ({ ...s, under18: e.target.checked }))} /> 18 yaş altı</label>
          </div>
          <Input label="Veli ad soyad" value={scalarForm.parentFullName} onChange={(e) => setScalarForm((s) => ({ ...s, parentFullName: e.target.value }))} />
          <Input label="Veli telefon" value={scalarForm.parentPhoneNumber} onChange={(e) => setScalarForm((s) => ({ ...s, parentPhoneNumber: e.target.value }))} />
          <Input label="Veli e-posta" value={scalarForm.parentEmailAddress} onChange={(e) => setScalarForm((s) => ({ ...s, parentEmailAddress: e.target.value }))} />
          <Input label="Veli yakınlık" value={scalarForm.parentRelationship} onChange={(e) => setScalarForm((s) => ({ ...s, parentRelationship: e.target.value }))} />
          <Input label="Acil kişi adı" value={scalarForm.emergencyFullName} onChange={(e) => setScalarForm((s) => ({ ...s, emergencyFullName: e.target.value }))} />
          <Input label="Acil kişi telefon" value={scalarForm.emergencyPhone} onChange={(e) => setScalarForm((s) => ({ ...s, emergencyPhone: e.target.value }))} />
          <Input label="Acil kişi yakınlık" value={scalarForm.emergencyRelationship} onChange={(e) => setScalarForm((s) => ({ ...s, emergencyRelationship: e.target.value }))} />
          <div className="lg:col-span-2"><Textarea label="Kullanıcı notları" value={scalarForm.userNotes} onChange={(e) => setScalarForm((s) => ({ ...s, userNotes: e.target.value }))} rows={2} /></div>
          <div className="lg:col-span-2"><Textarea label="Admin notları" value={scalarForm.notes} onChange={(e) => setScalarForm((s) => ({ ...s, notes: e.target.value }))} rows={2} /></div>
        </div>
      </Modal>
    </div>
  );
}
