import type { Lang } from "@/lib/i18n/dict";
import { t } from "@/lib/i18n/dict";
import { formatTrDateTime, formatTrLocalDate } from "@/lib/dates/formatTr";

export function labelYesNo(v: boolean | undefined, lang: Lang) {
  if (v === true) return t("yes", lang);
  if (v === false) return t("no", lang);
  return "-";
}

export function labelLanguageCampCategory(v: string | undefined, lang: Lang) {
  switch (v) {
    case "INDIVIDUAL":
      return t("individual", lang);
    case "CORPORATE":
      return t("corporate", lang);
    case "FAMILY":
      return t("family", lang);
    default:
      return v ?? "-";
  }
}

export function labelEducationLevel(v: string | undefined, lang: Lang) {
  switch (v) {
    case "BACHELOR":
      return t("bachelor", lang);
    case "MASTER":
      return t("master", lang);
    case "PHD":
      return t("phd", lang);
    default:
      return v ?? "-";
  }
}

export function labelStartTerm(v: string | undefined, lang: Lang) {
  switch (v) {
    case "FALL":
      return t("fall", lang);
    case "SPRING":
      return t("spring", lang);
    default:
      return v ?? "-";
  }
}

export function labelApplicationStatus(v: string | undefined, lang: Lang) {
  // Keeping keys inline to avoid bloating dict for now; easy to migrate later.
  if (!v) return "-";
  if (lang === "tr") {
    switch (v) {
      case "DRAFT":
        return "Taslak";
      case "SUBMITTED":
        return "Onaylı";
      case "IN_REVIEW":
        return "İnceleniyor";
      case "MISSING_DOCUMENTS":
        return "Eksik Belge";
      case "COMPLETED":
        return "Tamamlandı";
      case "REJECTED":
        return "Reddedildi";
      default:
        return v;
    }
  }
  // en
  switch (v) {
    case "DRAFT":
      return "Draft";
    case "SUBMITTED":
      return "Submitted";
    case "IN_REVIEW":
      return "In review";
    case "MISSING_DOCUMENTS":
      return "Missing documents";
    case "COMPLETED":
      return "Completed";
    case "REJECTED":
      return "Rejected";
    default:
      return v;
  }
}

export function labelUpdatedAt(lang: Lang) {
  return lang === "tr" ? "Güncellendi" : "Updated";
}

export function formatDateTime(lang: Lang, value?: string) {
  if (!value) return "-";
  if (lang === "tr") return formatTrDateTime(value);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateOnly(lang: Lang, value?: string) {
  if (!value) return "-";
  if (lang === "tr") return formatTrLocalDate(value);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function labelUniversityAccommodation(v: string | undefined, lang: Lang) {
  if (lang === "en") {
    switch (v) {
      case "CAMPUS_DORM":
        return "Campus dorm";
      case "PRIVATE":
        return "Private housing";
      case "ROOMMATE":
        return "Roommate";
      default:
        return v ?? "-";
    }
  }
  switch (v) {
    case "CAMPUS_DORM":
      return "Kampüs yurdu";
    case "PRIVATE":
      return "Özel konut";
    case "ROOMMATE":
      return "Oda arkadaşı";
    default:
      return v ?? "-";
  }
}

export function labelLanguageCampAccommodation(v: string | undefined, lang: Lang) {
  if (lang === "en") {
    switch (v) {
      case "HOST_FAMILY":
        return "Host family";
      case "DORMITORY":
        return "Dormitory";
      case "PRIVATE":
        return "Private";
      default:
        return v ?? "-";
    }
  }
  switch (v) {
    case "HOST_FAMILY":
      return "Aile yanı";
    case "DORMITORY":
      return "Yurt";
    case "PRIVATE":
      return "Özel";
    default:
      return v ?? "-";
  }
}

export function labelPassportType(v: string | undefined, lang: Lang) {
  if (lang === "en") {
    switch (v) {
      case "ORDINARY":
        return "Ordinary (maroon)";
      case "GREEN":
        return "Green";
      case "GRAY":
        return "Gray";
      case "BLACK":
        return "Black (diplomatic)";
      case "SPECIAL":
        return "Special";
      case "DIPLOMATIC":
        return "Diplomatic";
      case "SERVICE":
        return "Service";
      default:
        return v ?? "-";
    }
  }
  switch (v) {
    case "ORDINARY":
      return "Umuma mahsus (bordo)";
    case "GREEN":
      return "Yeşil";
    case "GRAY":
      return "Gri";
    case "BLACK":
      return "Siyah (diplomatik)";
    case "SPECIAL":
      return "Özel";
    case "DIPLOMATIC":
      return "Diplomatik";
    case "SERVICE":
      return "Hizmet";
    default:
      return v ?? "-";
  }
}

export function labelPaymentPreference(v: string | undefined, lang: Lang) {
  if (lang === "en") {
    switch (v) {
      case "ONE_TIME":
        return "One-time payment";
      case "INSTALLMENT":
        return "Installments";
      default:
        return v ?? "-";
    }
  }
  switch (v) {
    case "ONE_TIME":
      return "Tek seferde";
    case "INSTALLMENT":
      return "Taksitli";
    default:
      return v ?? "-";
  }
}

