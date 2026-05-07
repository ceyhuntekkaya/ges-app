import type { Lang } from "@/lib/i18n/dict";
import { t } from "@/lib/i18n/dict";

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
        return "Gönderildi";
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

