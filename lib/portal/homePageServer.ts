import { getBackendBaseUrl } from "@/lib/api/baseUrl";
import type { PortalHomePageContent } from "@/lib/portal/homePage";

export async function fetchPublicHomePageContent(): Promise<PortalHomePageContent | null> {
  const base = await getBackendBaseUrl();
  try {
    const res = await fetch(`${base}/v1/public/home-page`, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as PortalHomePageContent;
  } catch {
    return null;
  }
}
