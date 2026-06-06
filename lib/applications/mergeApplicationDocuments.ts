import type { UniversityApplicationDocumentDto } from "@/lib/api/generated/index";

export type DocumentRequirementLike = {
  id?: string;
  key?: string;
  title?: string | null;
  description?: string | null;
  required?: boolean;
  category?: string | null;
  allowedContentTypes?: string | null;
  maxSizeBytes?: number;
};

export type ChecklistItemLike = {
  requirement: DocumentRequirementLike;
  uploaded?: boolean;
  applicationDocumentId?: string | null;
  reviewNote?: string | null;
  file?: { id?: string; originalFilename?: string; contentType?: string; sizeBytes?: number } | null;
  downloadUrl?: string | null;
};

export type MergedApplicationDocumentItem = ChecklistItemLike & {
  legacyDocument?: UniversityApplicationDocumentDto;
  /** False for admin-added slots that do not map to a document requirement. */
  isChecklistRequirement?: boolean;
};

function norm(s?: string | null): string {
  return (s ?? "").trim().toLowerCase();
}

function hasLegacyFile(doc?: UniversityApplicationDocumentDto): boolean {
  return !!(doc?.documentUrl && doc.documentUrl.trim());
}

/** Match seeded/admin legacy slots to checklist requirements (same logic as backend seeder). */
export function matchesLegacyDocumentToRequirement(
  legacy: UniversityApplicationDocumentDto,
  requirement: DocumentRequirementLike,
): boolean {
  const name = norm(legacy.documentName);
  if (!name) return false;
  const key = norm(requirement.key);
  const title = norm(requirement.title);
  return name === key || (!!title && name === title);
}

export function mergeChecklistWithLegacyDocuments(
  items: ChecklistItemLike[],
  legacyDocuments: UniversityApplicationDocumentDto[],
): MergedApplicationDocumentItem[] {
  const usedLegacyIds = new Set<string>();
  const merged: MergedApplicationDocumentItem[] = items.map((item) => {
    const legacy = legacyDocuments.find(
      (d) => d.id && !usedLegacyIds.has(d.id) && matchesLegacyDocumentToRequirement(d, item.requirement),
    );
    if (legacy?.id) usedLegacyIds.add(legacy.id);

    const uploaded = !!item.uploaded || hasLegacyFile(legacy);
    return { ...item, uploaded, legacyDocument: legacy, isChecklistRequirement: true };
  });

  for (const legacy of legacyDocuments) {
    if (!legacy.id || usedLegacyIds.has(legacy.id)) continue;
    usedLegacyIds.add(legacy.id);
    merged.push({
      requirement: {
        key: legacy.id,
        title: legacy.documentName ?? undefined,
        description: legacy.documentDescription ?? undefined,
        required: legacy.required,
        category: "GENERAL",
      },
      uploaded: hasLegacyFile(legacy),
      legacyDocument: legacy,
      isChecklistRequirement: false,
    });
  }

  return merged;
}

export function countMissingRequiredDocuments(items: MergedApplicationDocumentItem[]): number {
  return items.filter((it) => it.requirement?.required && !it.uploaded).length;
}
