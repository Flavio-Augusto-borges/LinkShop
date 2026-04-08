export type CartItem = {
  id: string;
  ownerId: string;
  productId: string;
  offerId: string;
  quantity: number;
  unitPrice: number;
  addedAt: string;
};

export type Cart = {
  ownerId: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  updatedAt: string;
};
