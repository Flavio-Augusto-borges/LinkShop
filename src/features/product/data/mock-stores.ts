import type { Store } from "@/features/product/types/store.types";

export const mockStores: Store[] = [
  {
    id: "amazon",
    name: "Amazon",
    slug: "amazon",
    affiliateNetwork: "custom",
    isActive: true
  },
  {
    id: "mercado-livre",
    name: "Mercado Livre",
    slug: "mercado-livre",
    affiliateNetwork: "custom",
    isActive: true
  },
  {
    id: "shopee",
    name: "Shopee",
    slug: "shopee",
    affiliateNetwork: "custom",
    isActive: true
  }
];
