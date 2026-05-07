function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) throw new Error("Empty backend base url");
  // Accept http(s)://... only; otherwise make it explicit for safer fetch behavior.
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(`Invalid backend base url (expected http(s)://): ${trimmed}`);
  }
  return trimmed;
}

async function readInvokeUrlFromConfig(): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cfg = require("@/config/config.json") as unknown;
    if (!cfg || typeof cfg !== "object") return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCfg = cfg as any;
    const invokeUrl = anyCfg?.api?.invokeUrl;
    return typeof invokeUrl === "string" && invokeUrl.trim() ? invokeUrl.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Backend base URL resolution for server-side routes and server components.
 *
 * Supported env vars (first match wins):
 * - GES_BACKEND_BASE_URL
 * - BACKEND_BASE_URL
 * - NEXT_PUBLIC_BACKEND_BASE_URL (handy for local dev parity)
 * - (fallback) config/config.json -> api.invokeUrl
 */
export async function getBackendBaseUrl(): Promise<string> {
  const fromConfig = await readInvokeUrlFromConfig();
  const raw =
    process.env.GES_BACKEND_BASE_URL ??
    process.env.BACKEND_BASE_URL ??
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ??
    fromConfig ??
    "http://localhost:8080/api";

  return normalizeBaseUrl(raw);
}

