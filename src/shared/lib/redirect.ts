import type { Offer } from "@/features/product/types/offer.types";

export type OfferRedirectContext = {
  source?: string;
  position?: number;
  category?: string;
  searchTerm?: string;
  sectionType?: string;
};

export function getOfferRedirectHref(offer: Pick<Offer, "id">, context?: OfferRedirectContext) {
  const params = new URLSearchParams();

  if (context?.source?.trim()) {
    params.set("source", context.source.trim().toLowerCase());
  }

  if (typeof context?.position === "number" && Number.isFinite(context.position) && context.position > 0) {
    params.set("position", String(Math.floor(context.position)));
  }

  if (context?.category?.trim()) {
    params.set("category", context.category.trim());
  }

  if (context?.searchTerm?.trim()) {
    params.set("search_term", context.searchTerm.trim());
  }

  if (context?.sectionType?.trim()) {
    params.set("section_type", context.sectionType.trim().toLowerCase());
  }

  const basePath = `/api/redirect/${encodeURIComponent(offer.id)}`;
  return params.toString() ? `${basePath}?${params.toString()}` : basePath;
}
