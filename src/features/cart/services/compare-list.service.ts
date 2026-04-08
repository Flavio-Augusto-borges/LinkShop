import type { CartItem } from "@/features/cart/types/cart.types";
import { apiClient } from "@/shared/api/api-client";
import type { ApiResponse } from "@/shared/types/api.types";

type BackendCompareListItem = {
  id: string;
  user_id: string;
  product_id: string;
  offer_id: string;
  quantity: number;
  added_at: string;
  updated_at: string;
  offer: {
    price: string | number;
  };
};

function mapBackendCompareListItem(item: BackendCompareListItem): CartItem {
  return {
    id: item.id,
    ownerId: item.user_id,
    productId: item.product_id,
    offerId: item.offer_id,
    quantity: item.quantity,
    unitPrice: Number(item.offer.price),
    addedAt: item.added_at
  };
}

export const compareListService = {
  async listItems(token: string): Promise<ApiResponse<CartItem[]>> {
    const response = await apiClient.get<BackendCompareListItem[]>("/me/compare-list", { token });

    if (!response.ok) {
      return response;
    }

    return {
      ...response,
      data: response.data.map(mapBackendCompareListItem)
    };
  },

  async upsertItem(
    token: string,
    payload: { productId: string; offerId: string; quantity: number }
  ): Promise<ApiResponse<CartItem>> {
    const response = await apiClient.post<BackendCompareListItem>(
      "/me/compare-list",
      {
        product_id: payload.productId,
        offer_id: payload.offerId,
        quantity: payload.quantity
      },
      { token }
    );

    if (!response.ok) {
      return response;
    }

    return {
      ...response,
      data: mapBackendCompareListItem(response.data)
    };
  },

  async updateQuantity(token: string, itemId: string, quantity: number): Promise<ApiResponse<CartItem>> {
    const response = await apiClient.patch<BackendCompareListItem>(
      `/me/compare-list/${itemId}`,
      { quantity },
      { token }
    );

    if (!response.ok) {
      return response;
    }

    return {
      ...response,
      data: mapBackendCompareListItem(response.data)
    };
  },

  async removeItem(token: string, itemId: string): Promise<ApiResponse<{ success: true }>> {
    const response = await apiClient.delete<null>(`/me/compare-list/${itemId}`, { token });

    if (!response.ok) {
      return response;
    }

    return {
      ...response,
      data: { success: true }
    };
  }
};
