"use client";

import type { AdminRankingDiagnostic } from "@/features/admin/types/admin.types";
import { formatCurrency } from "@/shared/lib/format";
import { Panel } from "@/shared/ui/panel";

type AdminRankingDiagnosticsPanelProps = {
  items: AdminRankingDiagnostic[];
};

function formatScore(value: number | null) {
  if (value == null) {
    return "-";
  }

  return `${value.toFixed(1)} pts`;
}

export function AdminRankingDiagnosticsPanel({ items }: AdminRankingDiagnosticsPanelProps) {
  return (
    <Panel className="space-y-4">
      <div>
        <h3 className="font-display text-2xl text-ink">Diagnostico de ranking</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Leitura operacional da melhor oferta escolhida pelo backend para os produtos com maior interesse recente.
        </p>
      </div>

      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => {
            const bestDiff = item.bestOfferPrice != null && item.lowestPrice != null
              ? item.bestOfferPrice - item.lowestPrice
              : null;

            return (
              <article key={item.productId} className="rounded-[1.25rem] border border-black/5 bg-black/5 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{item.productLabel}</p>
                  <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-coral">
                    {formatScore(item.bestOfferScore)}
                  </span>
                </div>

                <div className="mt-3 grid gap-1 text-sm text-neutral-600">
                  <span>Menor preco bruto: {item.lowestPrice == null ? "-" : formatCurrency(item.lowestPrice)}</span>
                  <span>
                    Preco da melhor oferta: {item.bestOfferPrice == null ? "-" : formatCurrency(item.bestOfferPrice)}
                    {bestDiff != null && bestDiff > 0 ? ` (${formatCurrency(bestDiff)} acima do menor preco)` : ""}
                  </span>
                  <span>Loja da melhor oferta: {item.bestOfferStoreName ?? "-"}</span>
                  <span>{item.bestOfferReason ?? "Sem motivo detalhado no momento."}</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">Sem diagnostico de ranking disponivel neste ambiente.</p>
      )}
    </Panel>
  );
}
