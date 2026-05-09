export function humanizeStatus(status: number): string {
  if (status >= 200 && status < 300) return "Başarılı.";
  switch (status) {
    case 0:
      return "Ağ hatası (status 0).";
    case 400:
      return "Geçersiz istek (400).";
    case 401:
      return "Oturum gerekli / yetkisiz (401).";
    case 403:
      return "Bu işlem için yetkiniz yok (403).";
    case 404:
      return "Kayıt bulunamadı (404).";
    case 409:
      return "Çakışma oluştu (409).";
    case 413:
      return "İstek çok büyük (413).";
    case 415:
      return "Desteklenmeyen içerik tipi (415).";
    case 422:
      return "Doğrulama hatası (422).";
    case 429:
      return "Çok fazla istek (429).";
    case 500:
      return "Sunucu hatası (500).";
    case 502:
      return "Ağ geçidi hatası (502).";
    case 503:
      return "Servis geçici olarak kullanılamıyor (503).";
    case 504:
      return "Zaman aşımı (504).";
    default:
      if (status >= 500) return `Sunucu hatası (${status}).`;
      if (status >= 400) return `İstek başarısız (${status}).`;
      return `Beklenmeyen durum (${status}).`;
  }
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function humanizeApiError(err: unknown): string {
  // Common cases: fetch() rejects (TypeError), manual throw new Error(msg), etc.
  if (typeof err === "string") return err || "Beklenmeyen hata.";
  if (err instanceof Error) {
    const msg = err.message?.trim();
    return msg || "Beklenmeyen hata.";
  }

  // Some libs throw `{ status, data }` style objects; support that defensively.
  if (isRecord(err)) {
    const status = err.status;
    if (typeof status === "number") return humanizeStatus(status);

    const message = err.message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }

  return "Beklenmeyen hata.";
}

