import type { ProductPriceHistorySummary } from "@/features/product/types/price-history.types";
import { formatCurrency } from "@/shared/lib/format";

type ProductPriceHistoryProps = {
  summary: ProductPriceHistorySummary;
  currentPriceFallback: number;
};

function getTrendCopy(trend: ProductPriceHistorySummary["trend"], variationPercentage: number) {
  if (trend === "down") {
    return `Preco caiu ${Math.abs(variationPercentage)}% no periodo observado.`;
  }

  if (trend === "up") {
    return `Preco subiu ${variationPercentage}% no periodo observado.`;
  }

  return "Preco permaneceu estavel no periodo observado.";
}

export function ProductPriceHistory({ summary, currentPriceFallback }: ProductPriceHistoryProps) {
  const points = summary.points;
  const currentPrice = summary.currentPrice ?? currentPriceFallback;
  const lowestRecentPrice = summary.lowestRecentPrice ?? currentPriceFallback;
  const highestRecentPrice = summary.highestRecentPrice ?? currentPriceFallback;
  const maxPrice = points.length ? Math.max(...points.map((point) => point.price)) : currentPrice;
  const minPrice = points.length ? Math.min(...points.map((point) => point.price)) : currentPrice;
  const priceRange = Math.max(maxPrice - minPrice, 1);

  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-glow">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-coral">Historico de preco</p>
          <h3 className="mt-2 font-display text-3xl">Evolucao recente da melhor oferta</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
            {getTrendCopy(summary.trend, summary.variationPercentage)}
          </p>
        </div>

        <div className="grid gap-2 rounded-[1.5rem] bg-black/5 px-5 py-4 text-sm text-neutral-500">
          <span>Preco atual: {formatCurrency(currentPrice)}</span>
          <span>Menor preco recente: {formatCurrency(lowestRecentPrice)}</span>
          <span>Maior preco recente: {formatCurrency(highestRecentPrice)}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.25rem] bg-orange-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-coral">Atual</p>
          <strong className="mt-2 block font-display text-2xl">{formatCurrency(currentPrice)}</strong>
        </div>
        <div className="rounded-[1.25rem] bg-neutral-100 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Menor</p>
          <strong className="mt-2 block font-display text-2xl">{formatCurrency(lowestRecentPrice)}</strong>
        </div>
        <div className="rounded-[1.25rem] bg-neutral-100 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Maior</p>
          <strong className="mt-2 block font-display text-2xl">{formatCurrency(highestRecentPrice)}</strong>
        </div>
        <div className="rounded-[1.25rem] bg-lagoon/10 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-lagoon">Variacao</p>
          <strong className="mt-2 block font-display text-2xl">
            {summary.variationPercentage > 0 ? "+" : ""}
            {summary.variationPercentage}%
          </strong>
        </div>
      </div>

      <div className="mt-8">
        {points.length ? (
          <div className="grid gap-4">
            <div className="flex items-end gap-3">
              {points.map((point) => {
                const normalizedHeight = 72 + ((point.price - minPrice) / priceRange) * 88;

                return (
                  <div key={point.capturedAt} className="flex-1 text-center">
                    <div className="flex h-40 items-end justify-center">
                      <div
                        className="w-full rounded-t-[1rem] bg-gradient-to-t from-coral to-orange-300"
                        style={{ height: `${normalizedHeight}px` }}
                        title={`${point.label}: ${formatCurrency(point.price)}`}
                      />
                    </div>
                    <p className="mt-3 text-xs font-semibold text-neutral-700">{point.label}</p>
                    <p className="mt-1 text-xs text-neutral-500">{formatCurrency(point.price)}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-neutral-500">
              Baseado em {summary.sampleSize} capturas recentes do menor preco disponivel por periodo.
            </p>
          </div>
        ) : (
          <div className="rounded-[1.5rem] bg-black/5 p-5 text-sm text-neutral-600">
            Ainda nao ha pontos suficientes para mostrar a evolucao do preco.
          </div>
        )}
      </div>
    </section>
  );
}
