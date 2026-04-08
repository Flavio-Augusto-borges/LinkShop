import { mockOffers } from "@/features/product/data/mock-offers";
import { mockPriceHistory } from "@/features/product/data/mock-price-history";

export const offersMockRepository = {
  listOffers() {
    return [...mockOffers];
  },

  listPriceHistory() {
    return [...mockPriceHistory];
  }
};
