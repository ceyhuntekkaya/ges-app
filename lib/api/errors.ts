function safeStringify(x: unknown): string {
  try {
    if (typeof x === "string") return x;
    if (x instanceof Error) return x.message || String(x);
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
}

export function humanizeStatus(status?: number): string {
  if (!status) return "İstek başarısız.";
  if (status >= 200 && status < 300) return "Başarılı.";

  switch (status) {
    case 400:
      return "Geçersiz istek.";
    case 401:
      return "Oturum gerekli. Lütfen tekrar giriş yapın.";
    case 403:
      return "Bu işlem için yetkiniz yok.";
    case 404:
      return "Kayıt bulunamadı.";
    case 409:
      return "Çakışma: kayıt zaten mevcut olabilir.";
    case 413:
      return "Dosya çok büyük.";
    case 415:
      return "Desteklenmeyen içerik türü.";
    case 422:
      return "Doğrulama hatası.";
    case 429:
      return "Çok fazla istek. Lütfen tekrar deneyin.";
    case 500:
      return "Sunucu hatası.";
    case 502:
      return "Ağ geçidi hatası (backend erişilemiyor).";
    case 503:
      return "Servis geçici olarak kullanılamıyor.";
    default:
      return `İstek başarısız (HTTP ${status}).`;
  }
}

export function humanizeApiError(err: unknown): string {
  if (!err) return "Bilinmeyen hata.";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || "Beklenmeyen hata.";

  // Next/Fetch often throws TypeError on network errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;
  const msg =
    anyErr?.message ??
    anyErr?.error ??
    anyErr?.toString?.() ??
    safeStringify(err);

  return typeof msg === "string" && msg.trim() ? msg : "Beklenmeyen hata.";
}

