import type { Lang } from "@/lib/i18n/dict";
import { StoredFileDtoPurpose } from "@/lib/api/generated/index";

export type StoredFilePurposeValue = (typeof StoredFileDtoPurpose)[keyof typeof StoredFileDtoPurpose];

export const VISA_DOCUMENT_PURPOSE_OPTIONS: StoredFilePurposeValue[] = Object.values(
  StoredFileDtoPurpose,
) as StoredFilePurposeValue[];

export function labelStoredFilePurpose(purpose: StoredFilePurposeValue | string | undefined, lang: Lang): string {
  const labelsTr: Record<string, string> = {
    PROJECT_MEDIA: "Proje medyası",
    LANGUAGE_CAMP_GUARDIAN_CONSENT: "Dil kampı veli onayı",
    VISA_BANK_STATEMENT: "Vize banka dökümü",
    VISA_BIOMETRIC_PHOTO: "Vize biyometrik fotoğraf",
    LANGUAGE_CAMP_VISA_DOCUMENT: "Dil kampı vize belgesi",
    UNIVERSITY_PORTFOLIO_DOCUMENT: "Üniversite portfolyo",
    UNIVERSITY_APPLICATION_DOCUMENT: "Üniversite başvuru belgesi",
    UNIVERSITY_APPLICATION_PORTFOLIO: "Üniversite portfolyo dosyası",
    OTHER: "Diğer",
  };
  const labelsEn: Record<string, string> = {
    PROJECT_MEDIA: "Project media",
    LANGUAGE_CAMP_GUARDIAN_CONSENT: "Language camp guardian consent",
    VISA_BANK_STATEMENT: "Visa bank statement",
    VISA_BIOMETRIC_PHOTO: "Visa biometric photo",
    LANGUAGE_CAMP_VISA_DOCUMENT: "Language camp visa document",
    UNIVERSITY_PORTFOLIO_DOCUMENT: "University portfolio",
    UNIVERSITY_APPLICATION_DOCUMENT: "University application document",
    UNIVERSITY_APPLICATION_PORTFOLIO: "University application portfolio",
    OTHER: "Other",
  };
  const map = lang === "tr" ? labelsTr : labelsEn;
  return (purpose && map[purpose]) || purpose || "-";
}
