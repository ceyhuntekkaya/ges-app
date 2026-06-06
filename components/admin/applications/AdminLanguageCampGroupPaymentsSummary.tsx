"use client";

import type { LanguageCampApplicationGroupParticipantSummary } from "@/lib/applications/languageCampAdminGroups";
import { participantFullName } from "@/lib/applications/languageCampAdminGroups";
import { formatCampMoney } from "@/lib/applications/languageCampDisplay";

export function AdminLanguageCampGroupPaymentsSummary({
  participants,
}: {
  participants?: LanguageCampApplicationGroupParticipantSummary[];
}) {
  const list = participants ?? [];
  if (list.length <= 1) return null;

  return (
    <section className="rounded-[var(--radius-2xl)] border border-[var(--border-subtle)] bg-[var(--surface-0)] p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Grup ödeme özeti</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-left text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
              <th className="px-2 py-2 font-medium">Katılımcı</th>
              <th className="px-2 py-2 font-medium">Beklenen</th>
              <th className="px-2 py-2 font-medium">Ödenen</th>
              <th className="px-2 py-2 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id ?? participantFullName(p)} className="border-b border-[var(--border-subtle)] last:border-0">
                <td className="px-2 py-2 text-[var(--text-primary)]">{participantFullName(p)}</td>
                <td className="px-2 py-2 tabular-nums text-[var(--text-secondary)]">
                  {formatCampMoney(p.priceAmount, p.priceCurrency, "tr") ?? "-"}
                </td>
                <td className="px-2 py-2 tabular-nums text-[var(--text-secondary)]">
                  {formatCampMoney(p.totalPaidAmount, p.priceCurrency, "tr") ?? "-"}
                </td>
                <td className="px-2 py-2 text-[var(--text-secondary)]">
                  {p.paymentCompleted ? "Tamamlandı" : "Bekliyor"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
