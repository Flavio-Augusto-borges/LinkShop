import type { StoreId } from "@/features/product/types/store.types";

export type ClickEvent = {
  id: string;
  userId?: string;
  productId: string;
  offerId: string;
  storeId: StoreId;
  source: string;
  position?: number;
  category?: string;
  searchTerm?: string;
  sectionType?: string;
  placement?: string;
  createdAt: string;
};
