import type { StoreId } from "@/features/product/types/store.types";

export type OfferAvailability = "in_stock" | "low_stock" | "out_of_stock";

export type Offer = {
  id: string;
  productId: string;
  storeId: StoreId;
  sellerName: string;
  title: string;
  affiliateUrl: string;
  price: number;
  originalPrice?: number;
  currency: "BRL";
  installmentText?: string;
  shippingCost?: number;
  availability: OfferAvailability;
  isFeatured: boolean;
  lastSyncedAt: string;
  rankingScore?: number;
  qualityScore?: number;
  rankingReason?: string;
};
