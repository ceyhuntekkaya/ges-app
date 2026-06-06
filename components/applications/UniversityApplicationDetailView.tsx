import type { UniversityApplicationDetailDto } from "@/lib/api/generated/index";
import { UniversityApplicationDocumentsClient } from "@/components/applications/UniversityApplicationDocumentsClient";
import { FilePreview } from "@/components/ui";
import { resolvePortalFilePreviewUrl } from "@/lib/files/previewUrl";
import {
  DetailField,
  DetailGrid,
  DetailList,
  DetailSection,
  DetailTable,
} from "@/components/applications/detail/DetailPrimitives";
import type { Lang } from "@/lib/i18n/dict";
import { t } from "@/lib/i18n/dict";
import {
  formatDateOnly,
  formatDateTime,
  labelApplicationStatus,
  labelEducationLevel,
  labelStartTerm,
  labelUniversityAccommodation,
  labelYesNo,
} from "@/lib/i18n/labels";

export function UniversityApplicationDetailView({
  data,
  lang,
}: {
  data: UniversityApplicationDetailDto;
  lang: Lang;
}) {
  const id = data.id ?? "";

  return (
    <div className="grid gap-8">
      <DetailSection title={t("sectionGeneral", lang)}>
        <DetailGrid>
          <DetailField label={t("status", lang)} value={labelApplicationStatus(data.status, lang)} />
          <DetailField label="ID" value={<span className="font-mono text-xs">{id || "-"}</span>} />
          <DetailField label={t("educationLevel", lang)} value={labelEducationLevel(data.educationLevel, lang)} />
          <DetailField
            label={t("preferencesCompletedAt", lang)}
            value={formatDateTime(lang, data.preferencesCompletedAt)}
          />
          <DetailField label={t("created", lang)} value={formatDateTime(lang, data.createdAt)} />
          <DetailField label={t("updated", lang)} value={formatDateTime(lang, data.updatedAt)} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title={t("sectionPersonal", lang)}>
        <DetailGrid>
          <DetailField label={t("firstName", lang)} value={data.firstName} />
          <DetailField label={t("lastName", lang)} value={data.lastName} />
          <DetailField label={t("birthDate", lang)} value={formatDateOnly(lang, data.birthDate)} />
          <DetailField label={t("phone", lang)} value={data.phone} />
          <DetailField label={t("nationality", lang)} value={data.nationality} />
          <DetailField label={t("currentSchool", lang)} value={data.currentSchool} />
          <DetailField label={t("student", lang)} value={labelYesNo(data.student, lang)} />
          <DetailField label={t("classLevel", lang)} value={data.classLevel} />
          <DetailField label={t("referencePerson", lang)} value={data.referencePerson} />
          <DetailField label={t("consultancy", lang)} value={labelYesNo(data.consultancy, lang)} />
          <DetailField label={t("followerPerson", lang)} value={data.followerPerson} />
          <DetailField label={t("address", lang)} value={data.address} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title={t("sectionProgram", lang)}>
        <DetailGrid>
          <DetailField label={t("startTerm", lang)} value={labelStartTerm(data.startTermSeason, lang)} />
          <DetailField label={t("startYear", lang)} value={data.startYear != null ? String(data.startYear) : "-"} />
          <DetailField
            label={t("scholarshipRequested", lang)}
            value={labelYesNo(data.scholarshipRequested, lang)}
          />
          <DetailField label={t("scholarshipType", lang)} value={data.scholarshipType} />
          <DetailField label={t("notes", lang)} value={data.notes} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title={t("sectionPreferences", lang)}>
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <div className="mb-2 text-xs font-semibold text-zinc-500">{t("departmentPreferences", lang)}</div>
            <DetailList items={data.departmentPreferences} emptyLabel={t("noItems", lang)} />
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold text-zinc-500">{t("countryPreferences", lang)}</div>
            <DetailList items={data.countryPreferences} emptyLabel={t("noItems", lang)} />
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold text-zinc-500">{t("universityPreferences", lang)}</div>
            <DetailList items={data.universityPreferences} emptyLabel={t("noItems", lang)} />
          </div>
        </div>
      </DetailSection>

      <DetailSection title={t("sectionPricing", lang)}>
        <DetailGrid>
          <DetailField
            label={t("yearlyBudgetMin", lang)}
            value={data.yearlyBudgetMin != null ? String(data.yearlyBudgetMin) : "-"}
          />
          <DetailField
            label={t("yearlyBudgetMax", lang)}
            value={data.yearlyBudgetMax != null ? String(data.yearlyBudgetMax) : "-"}
          />
          <DetailField
            label={t("accommodationType", lang)}
            value={labelUniversityAccommodation(data.accommodationType, lang)}
          />
          <DetailField label={t("priceAmount", lang)} value={data.priceAmount != null ? String(data.priceAmount) : "-"} />
          <DetailField label={t("priceCurrency", lang)} value={data.priceCurrency} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title={t("sectionNotesMeetings", lang)}>
        <div className="grid gap-6">
          <div>
            <div className="mb-3 text-xs font-semibold text-zinc-500">{t("applicationNotes", lang)}</div>
            <DetailTable
              lang={lang}
              columns={["Yazan", "Tarih", "Not"]}
              rows={(data.applicationNotes ?? []).map((n) => [
                n.writtenBy ?? "-",
                formatDateTime(lang, n.writtenAt),
                n.todoText ?? "-",
              ])}
            />
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold text-zinc-500">{t("meetings", lang)}</div>
            <DetailTable
              lang={lang}
              columns={["Kişi", "Tarih", "Not", "Sonuç"]}
              rows={(data.meetings ?? []).map((m) => [
                m.person ?? "-",
                formatDateTime(lang, m.meetingAt),
                m.meetingNote ?? "-",
                m.meetingResult ?? "-",
              ])}
            />
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold text-zinc-500">{t("tasks", lang)}</div>
            <DetailTable
              lang={lang}
              columns={["Planlanan", "Kimle", "Ne yapılacak", "Durum"]}
              rows={(data.tasks ?? []).map((task) => [
                formatDateTime(lang, task.scheduledAt),
                task.withWhom ?? "-",
                task.whatToDo ?? "-",
                task.status ?? "-",
              ])}
            />
          </div>
        </div>
      </DetailSection>

      {id ? (
        <DetailSection title={t("sectionDocuments", lang)}>
          <UniversityApplicationDocumentsClient
            applicationId={id}
            lang={lang}
            initialLegacyDocuments={data.documents}
          />
        </DetailSection>
      ) : null}

      <DetailSection title={t("supplementaryMaterials", lang)}>
        <div className="grid gap-4">
          {(data.portfolioSections ?? []).length === 0 ? (
            <p className="text-sm text-zinc-500">{t("noItems", lang)}</p>
          ) : (
            (data.portfolioSections ?? []).map((s) => (
              <div key={s.id} className="rounded-xl border border-zinc-200 p-4">
                <div className="text-sm font-semibold text-zinc-900">
                  {s.sectionNameOverride ?? s.portfolioSection?.name ?? "-"}
                </div>
                {s.sectionDescriptionOverride ?? s.portfolioSection?.description ? (
                  <p className="mt-1 text-sm text-zinc-600">
                    {s.sectionDescriptionOverride ?? s.portfolioSection?.description}
                  </p>
                ) : null}
                <div className="mt-3 grid gap-2">
                  {(s.files ?? []).length === 0 ? (
                    <p className="text-xs text-zinc-500">{t("notUploaded", lang)}</p>
                  ) : (
                    (s.files ?? []).map((f) => {
                      const previewUrl = resolvePortalFilePreviewUrl({
                        applicationId: id,
                        fileUrl: f.fileUrl,
                      });
                      return (
                        <div key={f.id} className="rounded-lg border border-zinc-200 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span>
                              {f.name ?? f.type ?? "-"}
                              {f.description ? ` — ${f.description}` : ""}
                            </span>
                            {previewUrl ? (
                              <a href={previewUrl} className="text-sky-700 underline" target="_blank" rel="noreferrer">
                                {t("view", lang)}
                              </a>
                            ) : null}
                          </div>
                          {previewUrl && f.type !== "LINK" ? (
                            <div className="mt-3 aspect-[16/9] w-full overflow-hidden rounded-md bg-zinc-100">
                              <FilePreview
                                url={previewUrl}
                                filename={f.name ?? null}
                                fileType={f.type ?? null}
                                className="h-full w-full"
                              />
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DetailSection>

      <DetailSection title={t("sectionPayments", lang)}>
        <DetailTable
          lang={lang}
          columns={["Tarih", "Tutar", "Para birimi", "Alan"]}
          rows={(data.payments ?? []).map((p) => [
            formatDateTime(lang, p.paymentAt),
            p.amount != null ? String(p.amount) : "-",
            p.currency ?? "-",
            p.receivedBy ?? "-",
          ])}
        />
      </DetailSection>
    </div>
  );
}
