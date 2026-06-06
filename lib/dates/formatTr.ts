const TZ = "Europe/Istanbul";

type TrInstantParts = {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
};

function parseInstantParts(iso: string): TrInstantParts | null {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));

  const pick = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  let hour = pick("hour");
  let minute = pick("minute");
  if (/^\d$/.test(hour)) hour = `0${hour}`;
  if (/^\d$/.test(minute)) minute = `0${minute}`;

  return {
    day: pick("day"),
    month: pick("month"),
    year: pick("year"),
    hour,
    minute,
  };
}

/** ISO yyyy-aa-gg (veya zamanlı ISO) → gg.aa.yyyy */
export function formatTrLocalDate(iso?: string | null): string {
  if (!iso?.trim()) return "-";
  const d0 = iso.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d0)) return iso.trim();
  const [y, m, d] = d0.split("-");
  return `${d}.${m}.${y}`;
}

/** API Instant (ISO) → İstanbul yerel gg.aa.yyyy SS:DD */
export function formatTrInstant(iso?: string | null): string {
  if (!iso?.trim()) return "-";
  const parts = parseInstantParts(iso.trim());
  if (!parts) return iso.trim();
  return `${parts.day}.${parts.month}.${parts.year} ${parts.hour}:${parts.minute}`;
}

/**
 * Tarih/saat gösterimi:
 * - yyyy-aa-gg → gg.aa.yyyy
 * - ISO instant → gg.aa.yyyy SS:DD (İstanbul)
 */
export function formatTrDateTime(iso?: string | null): string {
  if (!iso?.trim()) return "-";
  const s = iso.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return formatTrLocalDate(s);
  }

  const parts = parseInstantParts(s);
  if (!parts) return s;

  const date = `${parts.day}.${parts.month}.${parts.year}`;
  if (s.includes("T") || /\d{2}:\d{2}/.test(s.slice(10))) {
    return `${date} ${parts.hour}:${parts.minute}`;
  }

  return date;
}
