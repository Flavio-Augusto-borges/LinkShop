"use client";

import { CompareListButton } from "@/features/cart/components/compare-list-button";
import { FavoriteToggleButton } from "@/features/favorites/components/favorite-toggle-button";
import { PriceWatchToggleButton } from "@/features/price-alerts/components/price-watch-toggle-button";

type ProductIntentActionsProps = {
  productId: string;
  offerId?: string | null;
  unitPrice: number;
  layout?: "row" | "stack";
  includePriceWatch?: boolean;
};

export function ProductIntentActions({
  productId,
  offerId,
  unitPrice,
  layout = "row",
  includePriceWatch = false
}: ProductIntentActionsProps) {
  if (!offerId) {
    return null;
  }

  return (
    <div className={`flex ${layout === "stack" ? "flex-col" : "flex-wrap"} gap-3`}>
      <FavoriteToggleButton productId={productId} variant="full" />
      <CompareListButton productId={productId} offerId={offerId} unitPrice={unitPrice} variant="full" />
      {includePriceWatch ? (
        <PriceWatchToggleButton productId={productId} currentPrice={unitPrice} variant="full" />
      ) : null}
    </div>
  );
}
