import { LanguageCampApplicationDocumentsClient } from "@/components/applications/LanguageCampApplicationDocumentsClient";
import { LanguageCampVisaFormSection } from "@/components/applications/LanguageCampVisaFormSection";
import {
  DetailField,
  DetailGrid,
  DetailSection,
  DetailTable,
} from "@/components/applications/detail/DetailPrimitives";
import type { LanguageCampApplicationDetailWithCrm } from "@/lib/applications/languageCampCrmTypes";
import type { Lang } from "@/lib/i18n/dict";
import { t } from "@/lib/i18n/dict";
import {
  formatDateOnly,
  formatDateTime,
  labelApplicationStatus,
  labelLanguageCampAccommodation,
  labelLanguageCampCategory,
  labelPaymentPreference,
  labelYesNo,
} from "@/lib/i18n/labels";

export function LanguageCampApplicationDetailView({
  data,
  lang,
}: {
  data: LanguageCampApplicationDetailWithCrm;
  lang: Lang;
}) {
  const ec = data.emergencyContact;

  return (
    <div className="grid gap-8">
      <DetailSection title={t("sectionGeneral", lang)}>
        <DetailGrid>
          <DetailField label={t("status", lang)} value={labelApplicationStatus(data.status, lang)} />
          <DetailField
            label="ID"
            value={<span className="font-mono text-xs">{data.id ?? "-"}</span>}
          />
          <DetailField label={t("category", lang)} value={labelLanguageCampCategory(data.category, lang)} />
          <DetailField label={t("created", lang)} value={formatDateTime(lang, data.createdAt)} />
          <DetailField label={t("updated", lang)} value={formatDateTime(lang, data.updatedAt)} />
          <DetailField label={t("kvkkAcceptedAt", lang)} value={formatDateTime(lang, data.kvkkAcceptedAt)} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title={t("sectionPersonal", lang)}>
        <DetailGrid>
          <DetailField label={t("firstName", lang)} value={data.firstName} />
          <DetailField label={t("lastName", lang)} value={data.lastName} />
          <DetailField label={t("birthDate", lang)} value={formatDateOnly(lang, data.birthDate)} />
          <DetailField label={t("phone", lang)} value={data.phone} />
          <DetailField label={t("isItSelf", lang)} value={labelYesNo(data.isItSelf, lang)} />
          <DetailField
            label={t("numberOfApplicant", lang)}
            value={data.numberOfApplicant != null ? String(data.numberOfApplicant) : "-"}
          />
          <DetailField label={t("under18", lang)} value={labelYesNo(data.under18, lang)} />
          <DetailField label={t("userNotes", lang)} value={data.userNotes} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title={t("sectionCamp", lang)}>
        <DetailGrid>
          <DetailField label={t("project", lang)} value={data.languageCampProjectTitle ?? data.languageCampProjectId} />
          <DetailField
            label={t("languageCampProjectId", lang)}
            value={<span className="font-mono text-xs">{data.languageCampProjectId ?? "-"}</span>}
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection title={t("sectionVisa", lang)}>
        <DetailGrid>
          <DetailField
            label={t("accommodationType", lang)}
            value={labelLanguageCampAccommodation(data.accommodationType, lang)}
          />
          <DetailField label={t("visaNeeded", lang)} value={labelYesNo(data.visaNeeded, lang)} />
          <DetailField label={t("visaFollowByGes", lang)} value={labelYesNo(data.visaFollowByGes, lang)} />
          <DetailField
            label={t("paymentPreference", lang)}
            value={labelPaymentPreference(data.paymentPreference, lang)}
          />
        </DetailGrid>
      </DetailSection>

      {data.id ? (
        <DetailSection title={t("sectionVisaForm", lang)}>
          <LanguageCampVisaFormSection applicationId={data.id} visaForm={data.visaForm} lang={lang} />
        </DetailSection>
      ) : null}

      <DetailSection title={t("sectionEmergency", lang)}>
        <DetailGrid>
          <DetailField label={t("emergencyContactName", lang)} value={ec?.fullName} />
          <DetailField label={t("emergencyContactPhone", lang)} value={ec?.phone} />
          <DetailField label={t("emergencyContactRelationship", lang)} value={ec?.relationship} />
        </DetailGrid>
      </DetailSection>

      {(data.under18 ||
        data.parentFullName ||
        data.parentPhoneNumber ||
        data.parentEmailAddress ||
        data.parentRelationship) && (
        <DetailSection title={t("sectionParent", lang)}>
          <DetailGrid>
            <DetailField label={t("parentFullName", lang)} value={data.parentFullName} />
            <DetailField label={t("parentPhoneNumber", lang)} value={data.parentPhoneNumber} />
            <DetailField label={t("parentEmailAddress", lang)} value={data.parentEmailAddress} />
            <DetailField label={t("parentRelationship", lang)} value={data.parentRelationship} />
          </DetailGrid>
        </DetailSection>
      )}

      {data.company || data.companyId ? (
        <DetailSection title={t("sectionCompany", lang)}>
          <DetailGrid>
            <DetailField label={t("companyName", lang)} value={data.company?.name} />
            <DetailField label={t("companyCode", lang)} value={data.company?.code} />
            <DetailField
              label="ID"
              value={<span className="font-mono text-xs">{data.companyId ?? data.company?.id ?? "-"}</span>}
            />
          </DetailGrid>
        </DetailSection>
      ) : null}

      {(data.applicationNotes?.length || data.meetings?.length || data.tasks?.length) && (
        <DetailSection title={t("sectionNotesMeetings", lang)}>
          <div className="grid gap-6">
            {data.applicationNotes?.length ? (
              <div>
                <div className="mb-3 text-xs font-semibold text-zinc-500">{t("applicationNotes", lang)}</div>
                <DetailTable
                  lang={lang}
                  columns={["Yazan", "Tarih", "Not"]}
                  rows={data.applicationNotes.map((n) => [
                    n.writtenBy ?? "-",
                    formatDateTime(lang, n.writtenAt),
                    n.todoText ?? "-",
                  ])}
                />
              </div>
            ) : null}
            {data.meetings?.length ? (
              <div>
                <div className="mb-3 text-xs font-semibold text-zinc-500">{t("meetings", lang)}</div>
                <DetailTable
                  lang={lang}
                  columns={["Kişi", "Tarih", "Not", "Sonuç"]}
                  rows={data.meetings.map((m) => [
                    m.person ?? "-",
                    formatDateTime(lang, m.meetingAt),
                    m.meetingNote ?? "-",
                    m.meetingResult ?? "-",
                  ])}
                />
              </div>
            ) : null}
            {data.tasks?.length ? (
              <div>
                <div className="mb-3 text-xs font-semibold text-zinc-500">{t("tasks", lang)}</div>
                <DetailTable
                  lang={lang}
                  columns={["Planlanan", "Kimle", "Ne yapılacak", "Durum"]}
                  rows={data.tasks.map((task) => [
                    formatDateTime(lang, task.scheduledAt),
                    task.withWhom ?? "-",
                    task.whatToDo ?? "-",
                    task.status ?? "-",
                  ])}
                />
              </div>
            ) : null}
          </div>
        </DetailSection>
      )}

      {data.id ? (
        <DetailSection title={t("sectionDocuments", lang)}>
          <LanguageCampApplicationDocumentsClient
            applicationId={data.id}
            lang={lang}
            initialLegacyDocuments={data.documents}
          />
        </DetailSection>
      ) : null}
    </div>
  );
}
