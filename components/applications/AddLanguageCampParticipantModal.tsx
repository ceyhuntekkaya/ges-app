"use client";

import * as React from "react";
import type { LanguageCampApplicationDetailDto } from "@/lib/api/generated/index";
import type { LanguageCampParticipantCreateRequest } from "@/lib/api/portalServer";
import { Button, Input, Modal, Switch } from "@/components/ui";
import type { Lang } from "@/lib/i18n/dict";
import { t } from "@/lib/i18n/dict";

type FormState = {
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  isItSelf: boolean;
  under18: boolean;
  parentFullName: string;
  parentPhoneNumber: string;
  parentEmailAddress: string;
  parentRelationship: string;
  accommodationType: string;
  visaNeeded: boolean;
  visaFollowByGes: boolean;
  paymentPreference: string;
  ecFullName: string;
  ecPhone: string;
  ecRelationship: string;
  userNotes: string;
};

function defaultsFromReference(ref?: LanguageCampApplicationDetailDto): FormState {
  const ec = ref?.emergencyContact;
  return {
    firstName: "",
    lastName: "",
    birthDate: "",
    phone: "",
    isItSelf: false,
    under18: false,
    parentFullName: "",
    parentPhoneNumber: "",
    parentEmailAddress: "",
    parentRelationship: "",
    accommodationType: ref?.accommodationType ?? "PRIVATE",
    visaNeeded: ref?.visaNeeded ?? false,
    visaFollowByGes: ref?.visaFollowByGes ?? false,
    paymentPreference: ref?.paymentPreference ?? "ONE_TIME",
    ecFullName: ec?.fullName ?? "",
    ecPhone: ec?.phone ?? "",
    ecRelationship: ec?.relationship ?? "",
    userNotes: "",
  };
}

function toPayload(form: FormState): LanguageCampParticipantCreateRequest {
  const hasEc = form.ecFullName.trim() || form.ecPhone.trim() || form.ecRelationship.trim();
  return {
    firstName: form.firstName.trim() || undefined,
    lastName: form.lastName.trim() || undefined,
    birthDate: form.birthDate || undefined,
    phone: form.phone.trim() || undefined,
    isItSelf: form.isItSelf,
    under18: form.under18,
    parentFullName: form.under18 ? form.parentFullName.trim() || undefined : undefined,
    parentPhoneNumber: form.under18 ? form.parentPhoneNumber.trim() || undefined : undefined,
    parentEmailAddress: form.under18 ? form.parentEmailAddress.trim() || undefined : undefined,
    parentRelationship: form.under18 ? form.parentRelationship.trim() || undefined : undefined,
    accommodationType: form.accommodationType || undefined,
    visaNeeded: form.visaNeeded,
    visaFollowByGes: form.visaFollowByGes,
    paymentPreference: form.paymentPreference || undefined,
    emergencyContact: hasEc
      ? {
          fullName: form.ecFullName.trim() || undefined,
          phone: form.ecPhone.trim() || undefined,
          relationship: form.ecRelationship.trim() || undefined,
        }
      : undefined,
    userNotes: form.userNotes.trim() || undefined,
  };
}

const selectCls =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

export function AddLanguageCampParticipantModal({
  open,
  onClose,
  projectId,
  referenceParticipant,
  lang,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  referenceParticipant?: LanguageCampApplicationDetailDto;
  lang: Lang;
  onCreated: (participantId: string) => void;
}) {
  const [form, setForm] = React.useState<FormState>(() => defaultsFromReference(referenceParticipant));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{ firstName?: boolean; lastName?: boolean }>({});

  React.useEffect(() => {
    if (open) {
      setForm(defaultsFromReference(referenceParticipant));
      setError(null);
      setFieldErrors({});
    }
  }, [open, referenceParticipant]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missingFirst = !form.firstName.trim();
    const missingLast = !form.lastName.trim();
    if (missingFirst || missingLast) {
      setFieldErrors({ firstName: missingFirst, lastName: missingLast });
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/proxy/v1/portal/language-camp-application-groups/${encodeURIComponent(projectId)}/participants`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(toPayload(form)),
        },
      );
      const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok || !data.id) {
        setError(data.message || `HTTP ${res.status}`);
        return;
      }
      onCreated(data.id);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={t("addParticipantTitle", lang)}
      description={t("addParticipantDescription", lang)}
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {t("cancel", lang)}
          </Button>
          <Button type="submit" form="add-participant-form" variant="primary" disabled={saving}>
            {saving ? t("addingParticipant", lang) : t("saveParticipant", lang)}
          </Button>
        </div>
      }
    >
      <form id="add-participant-form" onSubmit={(e) => void onSubmit(e)} className="grid max-h-[min(70vh,640px)] gap-6 overflow-y-auto pr-1">
        <section className="grid gap-4">
          <h4 className="text-sm font-semibold text-zinc-900">{t("sectionPersonal", lang)}</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t("firstName", lang)}
              value={form.firstName}
              onChange={(e) => patch("firstName", e.target.value)}
              error={fieldErrors.firstName ? t("requiredField", lang) : undefined}
              required
            />
            <Input
              label={t("lastName", lang)}
              value={form.lastName}
              onChange={(e) => patch("lastName", e.target.value)}
              error={fieldErrors.lastName ? t("requiredField", lang) : undefined}
              required
            />
            <Input
              label={t("birthDate", lang)}
              type="date"
              value={form.birthDate}
              onChange={(e) => patch("birthDate", e.target.value)}
            />
            <Input
              label={t("phone", lang)}
              type="tel"
              value={form.phone}
              onChange={(e) => patch("phone", e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <Switch
              label={t("isItSelf", lang)}
              checked={form.isItSelf}
              onChange={(v) => patch("isItSelf", v)}
            />
            <Switch
              label={t("under18", lang)}
              checked={form.under18}
              onChange={(v) => patch("under18", v)}
            />
          </div>
        </section>

        {form.under18 ? (
          <section className="grid gap-4 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
            <h4 className="text-sm font-semibold text-amber-950">{t("sectionParent", lang)}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={t("parentFullName", lang)}
                value={form.parentFullName}
                onChange={(e) => patch("parentFullName", e.target.value)}
              />
              <Input
                label={t("parentPhoneNumber", lang)}
                value={form.parentPhoneNumber}
                onChange={(e) => patch("parentPhoneNumber", e.target.value)}
              />
              <Input
                label={t("parentEmailAddress", lang)}
                type="email"
                value={form.parentEmailAddress}
                onChange={(e) => patch("parentEmailAddress", e.target.value)}
              />
              <Input
                label={t("parentRelationship", lang)}
                value={form.parentRelationship}
                onChange={(e) => patch("parentRelationship", e.target.value)}
              />
            </div>
          </section>
        ) : null}

        <section className="grid gap-4">
          <h4 className="text-sm font-semibold text-zinc-900">{t("sectionVisa", lang)}</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-zinc-600">{t("accommodationType", lang)}</span>
              <select
                className={selectCls}
                value={form.accommodationType}
                onChange={(e) => patch("accommodationType", e.target.value)}
              >
                <option value="HOST_FAMILY">{lang === "tr" ? "Aile yanı" : "Host family"}</option>
                <option value="DORMITORY">{lang === "tr" ? "Yurt" : "Dormitory"}</option>
                <option value="PRIVATE">{lang === "tr" ? "Özel" : "Private"}</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-zinc-600">{t("paymentPreference", lang)}</span>
              <select
                className={selectCls}
                value={form.paymentPreference}
                onChange={(e) => patch("paymentPreference", e.target.value)}
              >
                <option value="ONE_TIME">{lang === "tr" ? "Tek seferde" : "One-time"}</option>
                <option value="INSTALLMENT">{lang === "tr" ? "Taksitli" : "Installments"}</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-6">
            <Switch
              label={t("visaNeeded", lang)}
              checked={form.visaNeeded}
              onChange={(v) => patch("visaNeeded", v)}
            />
            <Switch
              label={t("visaFollowByGes", lang)}
              checked={form.visaFollowByGes}
              onChange={(v) => patch("visaFollowByGes", v)}
              disabled={!form.visaNeeded}
            />
          </div>
        </section>

        <section className="grid gap-4">
          <h4 className="text-sm font-semibold text-zinc-900">{t("sectionEmergency", lang)}</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label={t("emergencyContactName", lang)}
              value={form.ecFullName}
              onChange={(e) => patch("ecFullName", e.target.value)}
            />
            <Input
              label={t("emergencyContactPhone", lang)}
              value={form.ecPhone}
              onChange={(e) => patch("ecPhone", e.target.value)}
            />
            <Input
              label={t("emergencyContactRelationship", lang)}
              value={form.ecRelationship}
              onChange={(e) => patch("ecRelationship", e.target.value)}
            />
          </div>
        </section>

        <section>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-zinc-600">{t("userNotes", lang)}</span>
            <textarea
              className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              value={form.userNotes}
              onChange={(e) => patch("userNotes", e.target.value)}
            />
          </label>
        </section>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </Modal>
  );
}
