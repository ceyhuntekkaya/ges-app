import type {
  LanguageCampApplicationListItemDto,
  LanguageCampApplicationListItemDtoStatus,
} from "@/lib/api/generated/index";

export type LanguageCampApplicationGroupParticipantSummary = {
  id?: string;
  firstName?: string;
  lastName?: string;
  status?: LanguageCampApplicationListItemDtoStatus;
  isItSelf?: boolean;
  participantIndex?: number;
  paymentCompleted?: boolean;
  priceAmount?: number;
  priceCurrency?: string;
  totalPaidAmount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type LanguageCampApplicationGroupListItem = {
  applicantUserId?: string;
  applicantEmail?: string;
  applicantDisplayName?: string;
  languageCampProjectId?: string;
  languageCampProjectTitle?: string;
  category?: LanguageCampApplicationListItemDto["category"];
  participantCount?: number;
  primaryApplicationId?: string;
  participants?: LanguageCampApplicationListItemDto[];
  createdAt?: string;
  updatedAt?: string;
};

export type LanguageCampApplicationDetailWithGroup = {
  applicantUserId?: string;
  applicantEmail?: string;
  applicantDisplayName?: string;
  participantIndex?: number;
  participantCount?: number;
  groupParticipants?: LanguageCampApplicationGroupParticipantSummary[];
};

export type PageDto<T> = {
  items?: T[];
  page?: number;
  size?: number;
  totalItems?: number;
  totalPages?: number;
};

export type AdminLanguageCampGroupListParams = {
  page?: number;
  size?: number;
  status?: string;
  paymentCompleted?: boolean;
  languageCampProjectId?: string;
};

export function participantFullName(
  p: Pick<LanguageCampApplicationGroupParticipantSummary, "firstName" | "lastName">,
) {
  const n = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  return n || "İsimsiz katılımcı";
}

export function formatParticipantNames(participants?: LanguageCampApplicationListItemDto[]) {
  const list = participants ?? [];
  if (!list.length) return "-";
  return list.map((p) => `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "İsimsiz").join(", ");
}

export function groupMatchesQuery(group: LanguageCampApplicationGroupListItem, q: string) {
  const hay = [
    group.applicantUserId ?? "",
    group.applicantEmail ?? "",
    group.applicantDisplayName ?? "",
    group.languageCampProjectId ?? "",
    group.languageCampProjectTitle ?? "",
    group.primaryApplicationId ?? "",
    ...(group.participants ?? []).flatMap((p) => [p.id ?? "", p.firstName ?? "", p.lastName ?? ""]),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

export async function fetchAdminLanguageCampApplicationGroups(
  params: AdminLanguageCampGroupListParams,
): Promise<PageDto<LanguageCampApplicationGroupListItem>> {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 0));
  sp.set("size", String(params.size ?? 25));
  if (params.status) sp.set("status", params.status);
  if (params.paymentCompleted != null) sp.set("paymentCompleted", String(params.paymentCompleted));
  if (params.languageCampProjectId) sp.set("languageCampProjectId", params.languageCampProjectId);

  const res = await fetch(`/api/proxy/v1/admin/language-camp-application-groups?${sp.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return (await res.json()) as PageDto<LanguageCampApplicationGroupListItem>;
}
