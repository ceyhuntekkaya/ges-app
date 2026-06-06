import type { PortfolioSectionDto } from "@/lib/api/generated/index";

export type PortfolioSectionUpsertRequest = {
  name: string;
  description?: string | null;
  educationLevel?: "BACHELOR" | "MASTER" | "PHD" | null;
  departmentKeyword?: string | null;
  sortOrder: number;
  defaultRequired: boolean;
  active?: boolean | null;
};

export type CatalogPortfolioSectionsListParams = {
  q?: string;
  page?: number;
  size?: number;
};

export type PageDto<T> = {
  items?: T[];
  page?: number;
  size?: number;
  totalItems?: number;
  totalPages?: number;
};

async function parseJson<T>(res: Response): Promise<T> {
  const body = await res.text();
  return body ? (JSON.parse(body) as T) : ({} as T);
}

export async function catalogPortfolioSectionsList(params: CatalogPortfolioSectionsListParams = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.page != null) qs.set("page", String(params.page));
  if (params.size != null) qs.set("size", String(params.size));
  const res = await fetch(`/api/proxy/v1/admin/catalog/portfolio-sections?${qs.toString()}`, { cache: "no-store" });
  const data = await parseJson<PageDto<PortfolioSectionDto>>(res);
  return { status: res.status, data };
}

export async function catalogPortfolioSectionsCreate(body: PortfolioSectionUpsertRequest) {
  const res = await fetch(`/api/proxy/v1/admin/catalog/portfolio-sections`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJson<PortfolioSectionDto>(res);
  return { status: res.status, data };
}

export async function catalogPortfolioSectionsUpdate(id: string, body: PortfolioSectionUpsertRequest) {
  const res = await fetch(`/api/proxy/v1/admin/catalog/portfolio-sections/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJson<PortfolioSectionDto>(res);
  return { status: res.status, data };
}

export async function catalogPortfolioSectionsDelete(id: string) {
  const res = await fetch(`/api/proxy/v1/admin/catalog/portfolio-sections/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return { status: res.status };
}
