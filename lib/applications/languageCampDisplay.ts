import type {
  LanguageCampApplicationDetailDto,
  LanguageCampApplicationPaymentDto,
  LanguageCampProjectDetailDto,
} from "@/lib/api/generated/index";
import type { Lang } from "@/lib/i18n/dict";
import { t } from "@/lib/i18n/dict";

export function resolveMediaUrl(url?: string | null) {
  if (!url) return undefined;
  const u = url.trim();
  if (!u) return undefined;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/v1/")) return `/api/proxy${u}`;
  return u;
}

export function firstProjectImage(p?: LanguageCampProjectDetailDto) {
  const banner = resolveMediaUrl(p?.banner);
  if (banner) return banner;
  const small = resolveMediaUrl(p?.smallBanner);
  if (small) return small;
  const img = p?.images?.map(resolveMediaUrl).find(Boolean);
  return img;
}

export function formatCampMoney(price?: number, currency?: string, lang: Lang = "tr") {
  if (price === undefined || price === null) return null;
  const cur = currency?.trim() || "TRY";
  try {
    return new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-US", {
      style: "currency",
      currency: cur,
    }).format(price);
  } catch {
    return `${price} ${cur}`;
  }
}

export function formatCampDate(iso?: string, lang: Lang = "tr") {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function stripHtml(s?: string) {
  if (!s) return "";
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function sumPaymentAmounts(
  payments?: LanguageCampApplicationPaymentDto[],
  currency?: string | null
): number {
  const list = payments ?? [];
  if (!list.length) return 0;
  const cur = currency?.trim();
  const filtered = cur ? list.filter((p) => (p.currency?.trim() || "") === cur) : list;
  return filtered.reduce((sum, p) => sum + (p.amount ?? 0), 0);
}

export function participantLabel(p: LanguageCampApplicationDetailDto, lang: Lang) {
  const name = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  return name || t("participantUnnamed", lang);
}

export function groupSortKey(participants?: LanguageCampApplicationDetailDto[]) {
  if (!participants?.length) return "";
  return participants
    .map((p) => p.updatedAt ?? p.createdAt ?? "")
    .sort()
    .reverse()[0];
}
