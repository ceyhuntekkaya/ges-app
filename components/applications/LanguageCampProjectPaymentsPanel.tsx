"use client";

import type { LanguageCampApplicationDetailDto } from "@/lib/api/generated/index";
import { DetailTable } from "@/components/applications/detail/DetailPrimitives";
import {
  formatCampMoney,
  participantLabel,
  sumPaymentAmounts,
} from "@/lib/applications/languageCampDisplay";
import type { Lang } from "@/lib/i18n/dict";
import { t } from "@/lib/i18n/dict";

export function LanguageCampProjectPaymentsPanel({
  participants,
  lang,
}: {
  participants: LanguageCampApplicationDetailDto[];
  lang: Lang;
}) {
  const columns = [t("participantName", lang), t("amountDue", lang), t("amountPaid", lang)];

  const rows = participants.map((p) => {
    const paid = sumPaymentAmounts(p.payments, p.priceCurrency);
    return [
      participantLabel(p, lang),
      formatCampMoney(p.priceAmount, p.priceCurrency, lang) ?? "-",
      formatCampMoney(paid, p.priceCurrency, lang) ?? "-",
    ];
  });

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-zinc-900">{t("sectionPayments", lang)}</h3>
      <div className="mt-4">
        <DetailTable lang={lang} columns={columns} rows={rows} />
      </div>
    </section>
  );
}
