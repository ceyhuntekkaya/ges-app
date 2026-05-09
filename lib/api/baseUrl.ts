function normalizeBaseUrl(input: string): string {
  const s = input.trim();
  if (!s) return s;
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

/**
 * Backend base url, including Spring's context-path (`/api`).
 *
 * Examples:
 * - http://localhost:8080/api
 * - https://staging.example.com/api
 */
export async function getBackendBaseUrl(): Promise<string> {
  const fromEnv =
    process.env.GES_BACKEND_BASE_URL ||
    process.env.NEXT_PUBLIC_GES_BACKEND_BASE_URL ||
    process.env.BACKEND_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

  const base = normalizeBaseUrl(fromEnv || "http://localhost:8080/api");
  if (!base) throw new Error("Backend base url is empty.");
  return base;
}

