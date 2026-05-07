import "server-only";

import { getSession } from "@/lib/session";
import { getBackendBaseUrl } from "@/lib/api/baseUrl";

export type ApiResult<T> = {
  status: number;
  data: T | null;
  errorText?: string;
  headers?: Headers;
};

async function readErrorText(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const json = (await res.json().catch(() => null)) as unknown;
      if (json && typeof json === "object") {
        // Common shapes: {message}, {error}, {errors:[...]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyJson = json as any;
        const msg =
          anyJson?.message ??
          anyJson?.error ??
          (Array.isArray(anyJson?.errors) ? anyJson.errors.join("\n") : undefined);
        if (typeof msg === "string" && msg.trim()) return msg;
      }
      return JSON.stringify(json);
    }
    const text = await res.text().catch(() => "");
    return text || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const session = await getSession();
  if (!session?.accessToken) {
    return { status: 401, data: null, errorText: "Unauthorized" };
  }

  const base = await getBackendBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${session.accessToken}`);
  if (!headers.has("accept")) headers.set("accept", "application/json");

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  const status = res.status;
  const contentType = res.headers.get("content-type") ?? "";
  const hasBody = ![204, 205, 304].includes(status);

  if (status >= 200 && status < 300) {
    if (!hasBody) return { status, data: null, headers: res.headers };
    if (contentType.includes("application/json")) {
      const data = (await res.json().catch(() => null)) as T | null;
      return { status, data, headers: res.headers };
    }
    // unexpected content type, still return as text
    const txt = await res.text().catch(() => "");
    return { status, data: (txt as unknown as T) ?? null, headers: res.headers };
  }

  return {
    status,
    data: null,
    errorText: await readErrorText(res),
    headers: res.headers,
  };
}

// ---- Portal applications (server-side, authenticated) ----

import type {
  LanguageCampApplicationDetailDto,
  LanguageCampApplicationUpdateRequestDto,
  PageDtoLanguageCampApplicationListItemDto,
  PageDtoUniversityApplicationListItemDto,
  UniversityApplicationDetailDto,
  UniversityApplicationUpdateRequestDto,
} from "@/lib/api/generated";
import type {
  PortalLanguageCampApplicationsListMineParams,
  PortalUniversityApplicationsListMineParams,
} from "@/lib/api/generated";

function qs(params?: Record<string, unknown>) {
  const sp = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v === undefined) return;
    if (v === null) sp.append(k, "null");
    else sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function listMyUniversityApplications(
  params?: PortalUniversityApplicationsListMineParams,
): Promise<ApiResult<PageDtoUniversityApplicationListItemDto>> {
  return apiFetch(`/v1/portal/university-applications${qs(params as Record<string, unknown> | undefined)}`, {
    method: "GET",
  });
}

export async function getMyUniversityApplication(id: string): Promise<ApiResult<UniversityApplicationDetailDto>> {
  return apiFetch(`/v1/portal/university-applications/${encodeURIComponent(id)}`, { method: "GET" });
}

export async function updateMyUniversityApplicationDraft(
  id: string,
  body: UniversityApplicationUpdateRequestDto | Record<string, unknown>,
): Promise<ApiResult<UniversityApplicationDetailDto>> {
  return apiFetch(`/v1/portal/university-applications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}

export async function listMyLanguageCampApplications(
  params?: PortalLanguageCampApplicationsListMineParams,
): Promise<ApiResult<PageDtoLanguageCampApplicationListItemDto>> {
  return apiFetch(
    `/v1/portal/language-camp-applications${qs(params as Record<string, unknown> | undefined)}`,
    { method: "GET" },
  );
}

export async function getMyLanguageCampApplication(
  id: string,
): Promise<ApiResult<LanguageCampApplicationDetailDto>> {
  return apiFetch(`/v1/portal/language-camp-applications/${encodeURIComponent(id)}`, { method: "GET" });
}

export async function updateMyLanguageCampApplicationDraft(
  id: string,
  body: LanguageCampApplicationUpdateRequestDto | Record<string, unknown>,
): Promise<ApiResult<LanguageCampApplicationDetailDto>> {
  return apiFetch(`/v1/portal/language-camp-applications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}

// ---- Backward-compatible type exports for client components ----
export type UniversityApplicationDto = UniversityApplicationDetailDto;
export type UniversityApplicationUpdateDraft = Omit<
  UniversityApplicationUpdateRequestDto,
  "educationLevel" | "startTermSeason" | "accommodationType"
> & {
  educationLevel?: string;
  startTermSeason?: string;
  accommodationType?: string;
};
export type LanguageCampApplicationDto = LanguageCampApplicationDetailDto & {
  notes?: string;
};
export type LanguageCampApplicationUpdateDraft = Omit<
  LanguageCampApplicationUpdateRequestDto,
  "category" | "accommodationType" | "paymentPreference"
> & {
  category?: string;
  accommodationType?: string;
  paymentPreference?: string;
  notes?: string;
};

