import Link from "next/link";

import type { CatalogItem } from "@/features/catalog/types/catalog.types";
import { ProductIntentActions, ProductOfferCard } from "@/features/product";
import { formatCurrency } from "@/shared/lib/format";

type CatalogProductCardProps = {
  item: CatalogItem;
};

export function CatalogProductCard({ item }: CatalogProductCardProps) {
  const bestOffer = item.bestOffer;
  const bestOfferSavings = bestOffer?.originalPrice ? bestOffer.originalPrice - bestOffer.price : 0;
  const bestVsLowestGap = bestOffer ? bestOffer.price - item.lowestPrice : 0;
  const bestDiffersFromLowest = bestOffer ? bestOffer.price !== item.lowestPrice : false;

  return (
    <div className="space-y-3">
      <ProductOfferCard item={item} />

      <div className="rounded-[1.5rem] bg-white px-5 py-4 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1 text-sm text-neutral-500">
            <span>{item.offers.length} ofertas disponiveis</span>
            <span>Menor preco: {formatCurrency(item.lowestPrice)}</span>
            {bestOffer ? <span>Melhor oferta: {formatCurrency(bestOffer.price)}</span> : null}
            {bestDiffersFromLowest ? (
              <span>Diferenca para menor preco: {formatCurrency(bestVsLowestGap)}</span>
            ) : (
              <span>Melhor oferta coincide com o menor preco.</span>
            )}
            {item.bestOfferReason ? <span>Motivo: {item.bestOfferReason}</span> : null}
            {bestOfferSavings > 0 ? <span>Economia no anuncio: {formatCurrency(bestOfferSavings)}</span> : null}
          </div>

          <Link
            href={`/ofertas/${item.product.slug}`}
            className="inline-flex items-center justify-center rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Comparar ofertas
          </Link>
        </div>

        <div className="mt-4">
          <ProductIntentActions
            productId={item.product.id}
            offerId={item.bestOffer?.id}
            unitPrice={item.bestOffer?.price ?? item.lowestPrice}
          />
        </div>
      </div>
    </div>
  );
}
