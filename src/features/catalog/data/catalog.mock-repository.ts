import { mockOffers } from "@/features/product/data/mock-offers";
import { mockProducts } from "@/features/product/data/mock-products";

export const catalogMockRepository = {
  listProducts() {
    return [...mockProducts];
  },

  listOffers() {
    return [...mockOffers];
  }
};
