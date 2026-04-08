export type PriceHistory = {
  id: string;
  productId: string;
  offerId: string;
  capturedAt: string;
  price: number;
  originalPrice?: number;
};

export type ProductPriceHistoryPoint = {
  capturedAt: string;
  label: string;
  price: number;
};

export type ProductPriceHistorySummary = {
  currentPrice: number | null;
  lowestRecentPrice: number | null;
  highestRecentPrice: number | null;
  variationPercentage: number;
  trend: "down" | "up" | "stable";
  points: ProductPriceHistoryPoint[];
  sampleSize: number;
};
