import { cookies } from "next/headers";

export type { Lang } from "@/lib/i18n/dict";
export { dict, t } from "@/lib/i18n/dict";

const LANG_COOKIE = "ges_lang";

export async function getLang(): Promise<import("@/lib/i18n/dict").Lang> {
  const store = await cookies();
  const raw = store.get(LANG_COOKIE)?.value;
  return raw === "en" ? "en" : "tr";
}
