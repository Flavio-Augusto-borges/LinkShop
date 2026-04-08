"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { CatalogItem } from "@/features/catalog/types/catalog.types";
import { catalogService } from "@/features/catalog/services/catalog.service";
import { offersService } from "@/features/offers/services/offers.service";
import { PriceWatchSettingsCard } from "@/features/price-alerts/components/price-watch-settings-card";
import { priceWatchService } from "@/features/price-alerts/services/price-watch.service";
import type { PriceWatch } from "@/features/price-alerts/types/price-watch.types";
import type { ProductPriceHistorySummary } from "@/features/product/types/price-history.types";
import { useAuthStore, usePriceWatchStore } from "@/stores";
import { formatCurrency } from "@/shared/lib/format";
import { getPreferenceOwnerId } from "@/shared/lib/identity";

type AccountPriceWatchListProps = {
  limit?: number;
};

type WatchEntry = {
  item: CatalogItem;
  watch: PriceWatch;
  history: ProductPriceHistorySummary | null;
};

export function AccountPriceWatchList({ limit = 6 }: AccountPriceWatchListProps) {
  const session = useAuthStore((state) => state.session);
  const ownerId = useMemo(() => getPreferenceOwnerId(session), [session]);
  const allWatches = usePriceWatchStore((state) => state.watches);
  const watches = useMemo(
    () => allWatches.filter((watch) => watch.ownerId === ownerId && watch.isActive),
    [allWatches, ownerId]
  );
  const [entries, setEntries] = useState<WatchEntry[]>([]);

  useEffect(() => {
    let active = true;

    async function loadWatchItems() {
      if (!watches.length) {
        if (active) {
          setEntries([]);
        }
        return;
      }

      const response = await catalogService.getCatalogItemsByProductIds(watches.map((watch) => watch.productId));
      const items = response.ok ? response.data : [];
      const historyResults = await Promise.all(
        items.map(async (item) => {
          const historyResponse = await offersService.getProductPriceHistorySummary(item.product.id);
          return [item.product.id, historyResponse.ok ? historyResponse.data : null] as const;
        })
      );
      const historyByProductId = new Map(historyResults);

      if (active) {
        setEntries(
          watches
            .map((watch) => {
              const item = items.find((entry) => entry.product.id === watch.productId);

              if (!item) {
                return null;
              }

              return {
                watch,
                item,
                history: historyByProductId.get(watch.productId) ?? null
              };
            })
            .filter((entry): entry is WatchEntry => Boolean(entry))
            .slice(0, limit)
        );
      }
    }

    void loadWatchItems();

    return () => {
      active = false;
    };
  }, [limit, watches]);

  if (!watches.length) {
    return (
      <div className="rounded-[1.75rem] bg-white p-5 shadow-glow">
        <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-coral">Central de acompanhamento</p>
        <p className="mt-3 text-sm leading-7 text-neutral-600">
          Voce ainda nao esta acompanhando nenhum preco. Ative o acompanhamento na pagina de produto para configurar alertas e revisar oportunidades aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] bg-white p-5 shadow-glow">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-coral">Central de acompanhamento</p>
          <h3 className="mt-2 font-display text-3xl">Produtos monitorados</h3>
          <p className="mt-2 text-sm leading-7 text-neutral-600">
            Ajuste alertas por produto e acompanhe se o preco atual ja esta melhor do que o ultimo valor observado.
          </p>
        </div>
        <span className="text-sm text-neutral-500">{watches.length} acompanhamentos ativos</span>
      </div>

      <div className="mt-6 grid gap-4">
        {entries.map(({ item, watch, history }) => {
          const evaluation = priceWatchService.evaluateWatchStatus(watch, item.lowestPrice);

          return (
            <article key={item.product.id} className="rounded-[1.5rem] bg-black/5 p-4">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-coral/10 px-3 py-1 text-coral">{item.product.category}</span>
                    <span className="rounded-full bg-black/10 px-3 py-1 text-neutral-600">
                      {watch.targetPrice ? `Alvo: ${formatCurrency(watch.targetPrice)}` : "Sem preco-alvo"}
                    </span>
                    {evaluation.targetReached ? (
                      <span className="rounded-full bg-gold px-3 py-1 text-ink">Alvo atingido</span>
                    ) : null}
                  </div>

                  <div className="mt-3">
                    <Link href={`/ofertas/${item.product.slug}`} className="font-display text-2xl hover:text-coral">
                      {item.product.name}
                    </Link>
                    <p className="mt-2 text-sm text-neutral-500">{item.product.description}</p>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-neutral-600 md:grid-cols-2">
                    <span>Preco atual: {formatCurrency(item.lowestPrice)}</span>
                    <span>Ultimo preco conhecido: {formatCurrency(watch.lastKnownPrice)}</span>
                    <span>Menor preco recente: {formatCurrency(history?.lowestRecentPrice ?? item.lowestPrice)}</span>
                    <span>Status: {watch.isActive ? "Acompanhando" : "Pausado"}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className={`rounded-full px-3 py-1 ${watch.notifyOnPriceDrop ? "bg-lagoon/10 text-lagoon" : "bg-black/10 text-neutral-500"}`}>
                      Queda de preco {watch.notifyOnPriceDrop ? "ativa" : "desativada"}
                    </span>
                    <span className={`rounded-full px-3 py-1 ${watch.notifyOnNewBestOffer ? "bg-lagoon/10 text-lagoon" : "bg-black/10 text-neutral-500"}`}>
                      Nova melhor oferta {watch.notifyOnNewBestOffer ? "ativa" : "desativada"}
                    </span>
                    {evaluation.hasDropped ? (
                      <span className="rounded-full bg-gold px-3 py-1 text-ink">Preco caiu desde o ultimo acompanhamento</span>
                    ) : null}
                  </div>
                </div>

                <PriceWatchSettingsCard
                  productId={item.product.id}
                  productName={item.product.name}
                  currentPrice={item.lowestPrice}
                  variant="account"
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
