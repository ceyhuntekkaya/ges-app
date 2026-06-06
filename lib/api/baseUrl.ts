import { readFile } from "fs/promises";
import path from "path";

type GesAppConfig = {
  api?: {
    invokeUrl?: string;
  };
};

function normalizeBaseUrl(input: string): string {
  const s = input.trim();
  if (!s) return s;
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

function configPathCandidates(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, "config", "config.json"),
    path.join(cwd, "..", "config", "config.json"),
  ];
}

async function readInvokeUrlFromConfig(): Promise<string> {
  let lastError: unknown;
  for (const configPath of configPathCandidates()) {
    try {
      const raw = await readFile(configPath, "utf8");
      const parsed = JSON.parse(raw) as GesAppConfig;
      const invokeUrl = parsed.api?.invokeUrl?.trim();
      if (!invokeUrl) {
        throw new Error(`${configPath} içinde api.invokeUrl tanımlı değil.`);
      }
      return invokeUrl;
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error(
    `config/config.json okunamadı (${configPathCandidates().join(", ")}). ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

let cachedBaseUrl: string | null = null;

/**
 * Backend base url, including Spring's context-path (`/api`).
 * Read from `config/config.json` → `api.invokeUrl`.
 */
export async function getBackendBaseUrl(): Promise<string> {
  if (cachedBaseUrl) return cachedBaseUrl;

  const invokeUrl = await readInvokeUrlFromConfig();
  cachedBaseUrl = normalizeBaseUrl(invokeUrl);
  if (!cachedBaseUrl) throw new Error("api.invokeUrl boş.");
  return cachedBaseUrl;
}
