import { CompareListButton } from "@/features/cart/components/compare-list-button";
import type { CatalogItem } from "@/features/catalog/types/catalog.types";
import { FavoriteToggleButton } from "@/features/favorites/components/favorite-toggle-button";
import { ProductOfferCard } from "@/features/product";
import { formatCurrency } from "@/shared/lib/format";

type CatalogProductCardProps = {
  item: CatalogItem;
};

export function CatalogProductCard({ item }: CatalogProductCardProps) {
  const bestOffer = item.bestOffer;
  const productHref = `/ofertas/${item.product.slug}`;
  const offerId = item.bestOffer?.id ?? item.offers[0]?.id;
  const unitPrice = item.bestOffer?.price ?? item.lowestPrice;
  const bestOfferSavings = bestOffer?.originalPrice ? bestOffer.originalPrice - bestOffer.price : 0;
  const bestVsLowestGap = bestOffer ? bestOffer.price - item.lowestPrice : 0;
  const bestDiffersFromLowest = bestOffer ? bestOffer.price !== item.lowestPrice : false;

  return (
    <div className="space-y-3">
      <ProductOfferCard
        item={item}
        productHref={productHref}
        favoriteAction={<FavoriteToggleButton productId={item.product.id} variant="icon" />}
      />

      <div className="rounded-[1.5rem] bg-white px-5 py-4 shadow-glow">
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

        {offerId ? (
          <div className="mt-4">
            <CompareListButton productId={item.product.id} offerId={offerId} unitPrice={unitPrice} variant="full" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
