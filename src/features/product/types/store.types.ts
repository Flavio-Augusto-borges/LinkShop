export type StoreId = "amazon" | "mercado-livre" | "shopee";

export type Store = {
  id: StoreId;
  name: string;
  slug: string;
  affiliateNetwork: "in-house" | "awin" | "impact" | "custom";
  isActive: boolean;
};
