import type {
  LanguageCampApplicationDetailDto,
  LanguageCampApplicationListItemDto,
  LanguageCampProjectDetailDto,
  UniversityApplicationDetailDto,
} from "@/lib/api/generated/index";
import type { LanguageCampApplicationDetailWithCrm } from "@/lib/applications/languageCampCrmTypes";
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

// ---- Types (portal detail DTOs from OpenAPI) ----
export type LanguageCampApplicationDto = LanguageCampApplicationDetailDto;
export type UniversityApplicationDto = UniversityApplicationDetailDto;
export type LanguageCampApplicationUpdateDraft = {
  category?: string;
  languageCampProjectId?: string;
  languageCampProjectTitle?: string;
  startDate?: string;
  endDate?: string;
  accommodationType?: string;
  visaNeeded?: boolean;
  visaFollowByGes?: boolean;
  paymentPreference?: string;
  userNotes?: string;
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

export type LanguageCampApplicationGroupDto = {
  projectId?: string;
  project?: LanguageCampProjectDetailDto;
  participants?: LanguageCampApplicationDetailWithCrm[];
};

export type LanguageCampParticipantCreateRequest = {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phone?: string;
  isItSelf?: boolean;
  under18?: boolean;
  parentFullName?: string;
  parentPhoneNumber?: string;
  parentEmailAddress?: string;
  parentRelationship?: string;
  userNotes?: string;
  accommodationType?: string;
  visaNeeded?: boolean;
  visaFollowByGes?: boolean;
  paymentPreference?: string;
  emergencyContact?: { fullName?: string; phone?: string; relationship?: string };
};

// ---- Read endpoints ----
export async function listMyLanguageCampApplications(params?: {
  page?: number;
  size?: number;
  q?: string;
  status?: string;
}): Promise<PortalResult<PageDto<LanguageCampApplicationListItemDto>>> {
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

export async function listMyLanguageCampApplicationGroups(): Promise<
  PortalResult<LanguageCampApplicationGroupDto[]>
> {
  return portalFetch("/v1/portal/language-camp-application-groups", { method: "GET" });
}

export async function addLanguageCampParticipant(
  projectId: string,
  body?: LanguageCampParticipantCreateRequest,
): Promise<PortalResult<LanguageCampApplicationDto>> {
  return portalFetch(
    `/v1/portal/language-camp-application-groups/${encodeURIComponent(projectId)}/participants`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    },
  );
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

