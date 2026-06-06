import type { LanguageCampApplicationDetailDto } from "@/lib/api/generated/index";
import type { LanguageCampApplicationDetailWithGroup } from "@/lib/applications/languageCampAdminGroups";

export type LanguageCampApplicationNoteDto = {
  id?: string;
  writtenBy?: string;
  writtenAt?: string;
  todoText?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type LanguageCampApplicationMeetingDto = {
  id?: string;
  person?: string;
  meetingAt?: string;
  meetingNote?: string;
  meetingResult?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type LanguageCampApplicationTaskDto = {
  id?: string;
  scheduledAt?: string;
  withWhom?: string;
  whatToDo?: string;
  status?: "PENDING" | "DONE";
  performedByUser?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type LanguageCampApplicationDocumentDto = {
  id?: string;
  required?: boolean;
  documentName?: string;
  documentDescription?: string;
  documentUrl?: string;
  uploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type LanguageCampApplicationDetailWithCrm = LanguageCampApplicationDetailDto &
  LanguageCampApplicationDetailWithGroup & {
    followerPerson?: string;
    notes?: string;
    applicationNotes?: LanguageCampApplicationNoteDto[];
    meetings?: LanguageCampApplicationMeetingDto[];
    tasks?: LanguageCampApplicationTaskDto[];
    documents?: LanguageCampApplicationDocumentDto[];
  };

export type LanguageCampApplicationListItemWithCrm = {
  id?: string;
  firstName?: string;
  lastName?: string;
  status?: LanguageCampApplicationDetailDto["status"];
  category?: LanguageCampApplicationDetailDto["category"];
  languageCampProjectTitle?: string;
  paymentCompleted?: boolean;
  followerPerson?: string;
  priceAmount?: number;
  priceCurrency?: string;
  totalPaidAmount?: number;
  pendingTaskCount?: number;
  completedTaskCount?: number;
  pendingTaskScheduledAts?: string[];
  meetingCount?: number;
  documentCount?: number;
  documentsWithFileCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export function languageCampAdminBase(id: string) {
  return `/api/proxy/v1/admin/language-camp-applications/${encodeURIComponent(id)}`;
}
