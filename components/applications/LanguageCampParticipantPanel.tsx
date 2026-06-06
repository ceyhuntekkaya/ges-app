"use client";

import * as React from "react";
import { LanguageCampApplicationDocumentsClient } from "@/components/applications/LanguageCampApplicationDocumentsClient";
import { LanguageCampVisaFormSection } from "@/components/applications/LanguageCampVisaFormSection";
import type { LanguageCampApplicationDetailWithCrm } from "@/lib/applications/languageCampCrmTypes";
import { DetailTable } from "@/components/applications/detail/DetailPrimitives";
import type { Lang } from "@/lib/i18n/dict";
import { t } from "@/lib/i18n/dict";
import {
  formatDateOnly,
  formatDateTime,
  labelApplicationStatus,
  labelLanguageCampAccommodation,
  labelPaymentPreference,
  labelYesNo,
} from "@/lib/i18n/labels";

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium text-zinc-900">{value ?? "-"}</dd>
    </div>
  );
}

export function LanguageCampParticipantPanel({
  participant,
  lang,
}: {
  participant: LanguageCampApplicationDetailWithCrm;
  lang: Lang;
}) {
  const ec = participant.emergencyContact;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-200">
          {labelApplicationStatus(participant.status, lang)}
        </span>
        {participant.isItSelf ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
            {t("isItSelf", lang)}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard label={t("firstName", lang)} value={participant.firstName} />
        <InfoCard label={t("lastName", lang)} value={participant.lastName} />
        <InfoCard label={t("birthDate", lang)} value={formatDateOnly(lang, participant.birthDate)} />
        <InfoCard label={t("phone", lang)} value={participant.phone} />
        <InfoCard label={t("under18", lang)} value={labelYesNo(participant.under18, lang)} />
        <InfoCard
          label={t("accommodationType", lang)}
          value={labelLanguageCampAccommodation(participant.accommodationType, lang)}
        />
        <InfoCard label={t("visaNeeded", lang)} value={labelYesNo(participant.visaNeeded, lang)} />
        <InfoCard label={t("visaFollowByGes", lang)} value={labelYesNo(participant.visaFollowByGes, lang)} />
        <InfoCard
          label={t("paymentPreference", lang)}
          value={labelPaymentPreference(participant.paymentPreference, lang)}
        />
      </div>

      {(participant.under18 ||
        participant.parentFullName ||
        participant.parentPhoneNumber ||
        participant.parentEmailAddress) && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-zinc-900">{t("sectionParent", lang)}</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard label={t("parentFullName", lang)} value={participant.parentFullName} />
            <InfoCard label={t("parentPhoneNumber", lang)} value={participant.parentPhoneNumber} />
            <InfoCard label={t("parentEmailAddress", lang)} value={participant.parentEmailAddress} />
            <InfoCard label={t("parentRelationship", lang)} value={participant.parentRelationship} />
          </div>
        </div>
      )}

      {participant.id ? (
        <section className="rounded-xl border border-teal-100 bg-teal-50/30 p-4">
          <h4 className="mb-4 text-sm font-semibold text-zinc-900">{t("sectionVisaForm", lang)}</h4>
          <LanguageCampVisaFormSection
            applicationId={participant.id}
            visaForm={participant.visaForm}
            lang={lang}
          />
        </section>
      ) : null}

      <div>
        <h4 className="mb-3 text-sm font-semibold text-zinc-900">{t("sectionEmergency", lang)}</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoCard label={t("emergencyContactName", lang)} value={ec?.fullName} />
          <InfoCard label={t("emergencyContactPhone", lang)} value={ec?.phone} />
          <InfoCard label={t("emergencyContactRelationship", lang)} value={ec?.relationship} />
        </div>
      </div>

      {participant.userNotes ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
            {t("userNotes", lang)}
          </div>
          <p className="mt-2 text-sm leading-6 text-amber-950">{participant.userNotes}</p>
        </div>
      ) : null}

      {(participant.applicationNotes?.length ||
        participant.meetings?.length ||
        participant.tasks?.length) ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <h4 className="mb-4 text-sm font-semibold text-zinc-900">{t("sectionNotesMeetings", lang)}</h4>
          <div className="grid gap-6">
            {participant.applicationNotes?.length ? (
              <div>
                <div className="mb-2 text-xs font-semibold text-zinc-500">{t("applicationNotes", lang)}</div>
                <DetailTable
                  lang={lang}
                  columns={["Yazan", "Tarih", "Not"]}
                  rows={participant.applicationNotes.map((n) => [
                    n.writtenBy ?? "-",
                    formatDateTime(lang, n.writtenAt),
                    n.todoText ?? "-",
                  ])}
                />
              </div>
            ) : null}
            {participant.meetings?.length ? (
              <div>
                <div className="mb-2 text-xs font-semibold text-zinc-500">{t("meetings", lang)}</div>
                <DetailTable
                  lang={lang}
                  columns={["Kişi", "Tarih", "Not", "Sonuç"]}
                  rows={participant.meetings.map((m) => [
                    m.person ?? "-",
                    formatDateTime(lang, m.meetingAt),
                    m.meetingNote ?? "-",
                    m.meetingResult ?? "-",
                  ])}
                />
              </div>
            ) : null}
            {participant.tasks?.length ? (
              <div>
                <div className="mb-2 text-xs font-semibold text-zinc-500">{t("tasks", lang)}</div>
                <DetailTable
                  lang={lang}
                  columns={["Planlanan", "Kimle", "Ne yapılacak", "Durum"]}
                  rows={participant.tasks.map((task) => [
                    formatDateTime(lang, task.scheduledAt),
                    task.withWhom ?? "-",
                    task.whatToDo ?? "-",
                    task.status ?? "-",
                  ])}
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {participant.id ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <h4 className="mb-4 text-sm font-semibold text-zinc-900">{t("sectionDocuments", lang)}</h4>
          <LanguageCampApplicationDocumentsClient
            applicationId={participant.id}
            lang={lang}
            initialLegacyDocuments={participant.documents}
          />
        </section>
      ) : null}
    </div>
  );
}
