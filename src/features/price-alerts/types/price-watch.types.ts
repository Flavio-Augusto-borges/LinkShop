export type PriceWatch = {
  id: string;
  ownerId: string;
  productId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lastKnownPrice: number;
  targetPrice: number | null;
  notifyOnPriceDrop: boolean;
  notifyOnNewBestOffer: boolean;
  lastTriggeredAt?: string;
};
