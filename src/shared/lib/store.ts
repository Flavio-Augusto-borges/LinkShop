import type { OfferAvailability } from "@/features/product/types/offer.types";
import type { StoreId } from "@/features/product/types/store.types";

export function getStoreDisplayName(storeId: StoreId) {
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

export function getAvailabilityLabel(availability: OfferAvailability) {
  switch (availability) {
    case "in_stock":
      return "Em estoque";
    case "low_stock":
      return "Ultimas unidades";
    case "out_of_stock":
      return "Indisponivel";
    default:
      return availability;
  }
}
