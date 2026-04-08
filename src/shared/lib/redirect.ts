import type { Offer } from "@/features/product/types/offer.types";

export function getOfferRedirectHref(offer: Pick<Offer, "id">) {
  return `/api/redirect/${encodeURIComponent(offer.id)}`;
}
