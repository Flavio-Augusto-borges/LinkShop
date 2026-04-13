import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

import type { CatalogItem } from "@/features/catalog/types/catalog.types";
import type { Offer } from "@/features/product/types/offer.types";
import { formatCurrency } from "@/shared/lib/format";

type ProductOfferCardProps = {
  item: CatalogItem;
  offer?: Offer;
  productHref?: string;
  favoriteAction?: ReactNode;
};

function getStoreLabel(storeId: Offer["storeId"]) {
  switch (storeId) {
    case "amazon":
      return "Amazon";
    case "mercado-livre":
      return "Mercado Livre";
    case "shopee":
      return "Shopee";
    default:
      return storeId;
  }
}

export function ProductOfferCard({ item, offer, productHref, favoriteAction }: ProductOfferCardProps) {
  const product = item.product;
  const resolvedOffer = offer ?? item.bestOffer;
  const bestDiffersFromLowest = resolvedOffer ? resolvedOffer.price !== item.lowestPrice : false;

  if (!resolvedOffer) {
    return null;
  }

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-glow">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-orange-50 to-neutral-100">
        {productHref ? <Link href={productHref} aria-label={`Ver ${product.name}`} className="absolute inset-0 z-10" /> : null}
        <Image
          src={product.thumbnailUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          className="object-contain p-4 md:p-5"
        />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {item.bestDiscountPercentage > 0 ? (
            <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-ink">
              {item.bestDiscountPercentage}% OFF
            </span>
          ) : null}
          {resolvedOffer.isFeatured ? (
            <span className="rounded-full bg-lagoon/10 px-3 py-1 text-xs font-bold text-lagoon">Destaque</span>
          ) : null}
        </div>

        {favoriteAction ? <div className="absolute right-4 top-4 z-20">{favoriteAction}</div> : null}
      </div>

      <div className="grid gap-4 p-5">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-lagoon/10 px-3 py-1 text-lagoon">{getStoreLabel(resolvedOffer.storeId)}</span>
          <span className="rounded-full bg-black/5 px-3 py-1 text-neutral-700">{product.category}</span>
        </div>

        <div>
          <h3 className="font-display text-xl leading-tight">
            {productHref ? (
              <Link href={productHref} className="transition hover:text-coral">
                {product.name}
              </Link>
            ) : (
              product.name
            )}
          </h3>
        </div>

        <div className="flex items-end gap-3">
          <strong className="font-display text-2xl">{formatCurrency(resolvedOffer.price)}</strong>
          {resolvedOffer.originalPrice ? (
            <span className="text-sm text-neutral-400 line-through">{formatCurrency(resolvedOffer.originalPrice)}</span>
          ) : null}
        </div>

        <div className="grid gap-2 text-sm text-neutral-500">
          <span>Melhor oferta em {getStoreLabel(resolvedOffer.storeId)}</span>
          <span>Menor preco bruto entre lojas: {formatCurrency(item.lowestPrice)}</span>
          {bestDiffersFromLowest ? (
            <span>Diferenca para menor preco: {formatCurrency(resolvedOffer.price - item.lowestPrice)}</span>
          ) : (
            <span>Melhor oferta coincide com o menor preco.</span>
          )}
          {resolvedOffer.rankingReason ? <span>{resolvedOffer.rankingReason}</span> : null}
          <span>Vendido por {resolvedOffer.sellerName}</span>
          <span>{resolvedOffer.installmentText ?? "Pagamento a vista"}</span>
          <span>Popularidade do produto: {product.popularityScore}</span>
        </div>
      </div>
    </article>
  );
}
