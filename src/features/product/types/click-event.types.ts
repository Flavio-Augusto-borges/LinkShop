import type { StoreId } from "@/features/product/types/store.types";

export type ClickEvent = {
  id: string;
  userId?: string;
  productId: string;
  offerId: string;
  storeId: StoreId;
  source: "catalog" | "comparison" | "favorites" | "cart";
  placement: string;
  createdAt: string;
};
