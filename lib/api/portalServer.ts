import { cookies } from "next/headers";
import { getBackendBaseUrl } from "./baseUrl";

const ACCESS_TOKEN_COOKIE = "ges_access_token";

export type PortalResult<T> = {
  status: number;
  data?: T;
  errorText?: string;
};

function toQuery(params: Record<string, unknown> | undefined) {
  if (!params) return "";
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function readBody(res: Response): Promise<{ data?: unknown; errorText?: string }> {
  const text = await res.text().catch(() => "");
  if (!text) return {};
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return { data: JSON.parse(text) };
    } catch {
      return { errorText: text };
    }
  }
  // Sometimes backend returns HTML on auth failures / errors.
  return { errorText: text };
}

async function portalFetch<T>(path: string, init?: RequestInit): Promise<PortalResult<T>> {
  const base = await getBackendBaseUrl();
  const jar = await cookies();
  const token = jar.get(ACCESS_TOKEN_COOKIE)?.value;

  const headers = new Headers(init?.headers);
  headers.set("accept", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (e) {
    return { status: 502, errorText: String(e) };
  }

  const parsed = await readBody(res);
  if (res.ok) return { status: res.status, data: parsed.data as T };
  return { status: res.status, errorText: parsed.errorText || JSON.stringify(parsed.data ?? "") };
}

// ---- Types (kept intentionally permissive; backend schema may evolve) ----
export type LanguageCampApplicationDto = {
  id?: string;
  status?: string;
  category?: string;
  programId?: string;
  startDate?: string;
  endDate?: string;
  accommodationType?: string;
  visaNeeded?: boolean;
  visaFollowByGes?: boolean;
  paymentPreference?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: unknown;
};

export type UniversityApplicationDto = {
  id?: string;
  status?: string;
  educationLevel?: string;
  startTermSeason?: string;
  startYear?: number;
  yearlyBudgetMin?: number;
  yearlyBudgetMax?: number;
  scholarshipRequested?: boolean;
  scholarshipType?: string;
  accommodationType?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: unknown;
};
export type LanguageCampApplicationUpdateDraft = {
  category?: string;
  programId?: string;
  startDate?: string;
  endDate?: string;
  accommodationType?: string;
  visaNeeded?: boolean;
  visaFollowByGes?: boolean;
  paymentPreference?: string;
  notes?: string;
  [k: string]: unknown;
};

export type UniversityApplicationUpdateDraft = {
  educationLevel?: string;
  startTermSeason?: string;
  startYear?: number;
  yearlyBudgetMin?: number;
  yearlyBudgetMax?: number;
  scholarshipRequested?: boolean;
  scholarshipType?: string;
  accommodationType?: string;
  notes?: string;
  [k: string]: unknown;
};

export type PageDto<T> = { items?: T[]; page?: number; size?: number; totalItems?: number; totalPages?: number };

// ---- Read endpoints ----
export async function listMyLanguageCampApplications(params?: {
  page?: number;
  size?: number;
  q?: string;
  status?: string;
}): Promise<PortalResult<PageDto<{ id?: string; status?: string; category?: string; createdAt?: string; updatedAt?: string }>>> {
  return portalFetch(`/v1/portal/language-camp-applications${toQuery(params as Record<string, unknown> | undefined)}`, {
    method: "GET",
  });
}

export async function listMyUniversityApplications(params?: {
  page?: number;
  size?: number;
  q?: string;
  status?: string;
}): Promise<
  PortalResult<
    PageDto<{
      id?: string;
      status?: string;
      educationLevel?: string;
      createdAt?: string;
      updatedAt?: string;
    }>
  >
> {
  return portalFetch(`/v1/portal/university-applications${toQuery(params as Record<string, unknown> | undefined)}`, {
    method: "GET",
  });
}

export async function getMyLanguageCampApplication(id: string): Promise<PortalResult<LanguageCampApplicationDto>> {
  return portalFetch(`/v1/portal/language-camp-applications/${encodeURIComponent(id)}`, { method: "GET" });
}

export async function getMyUniversityApplication(id: string): Promise<PortalResult<UniversityApplicationDto>> {
  return portalFetch(`/v1/portal/university-applications/${encodeURIComponent(id)}`, { method: "GET" });
}

// ---- Update draft endpoints (used by Next route handlers) ----
export async function updateMyLanguageCampApplicationDraft(
  id: string,
  body: LanguageCampApplicationUpdateDraft,
): Promise<PortalResult<LanguageCampApplicationDto>> {
  return portalFetch(`/v1/portal/language-camp-applications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}

export async function updateMyUniversityApplicationDraft(
  id: string,
  body: UniversityApplicationUpdateDraft,
): Promise<PortalResult<UniversityApplicationDto>> {
  return portalFetch(`/v1/portal/university-applications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}

