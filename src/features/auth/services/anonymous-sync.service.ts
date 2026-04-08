import type { CartItem } from "@/features/cart/types/cart.types";
import type { Favorite } from "@/features/favorites/types/favorite.types";
import type { PriceWatch } from "@/features/price-alerts/types/price-watch.types";
import { apiClient } from "@/shared/api/api-client";
import type { ApiResponse } from "@/shared/types/api.types";

type BackendSyncResponse = {
  favorites: Array<{
    id: string;
    user_id: string;
    product_id: string;
    created_at: string;
  }>;
  compare_list: Array<{
    id: string;
    user_id: string;
    product_id: string;
    offer_id: string;
    quantity: number;
    added_at: string;
    offer: {
      price: string | number;
    };
  }>;
  price_watches: Array<{
    id: string;
    user_id: string;
    product_id: string;
    is_active: boolean;
    last_known_price: string | number | null;
    created_at: string;
    updated_at: string;
    alert_config: {
      target_price: string | number | null;
      notify_on_price_drop: boolean;
      notify_on_new_best_offer: boolean;
      last_triggered_at: string | null;
    };
  }>;
};

export type AnonymousSyncResult = {
  favorites: Favorite[];
  compareList: CartItem[];
  priceWatches: PriceWatch[];
};

function mapFavorite(item: BackendSyncResponse["favorites"][number]): Favorite {
  return {
    id: item.id,
    userId: item.user_id,
    productId: item.product_id,
    createdAt: item.created_at
  };
}

function mapCompareListItem(item: BackendSyncResponse["compare_list"][number]): CartItem {
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

function mapPriceWatch(item: BackendSyncResponse["price_watches"][number]): PriceWatch {
  return {
    id: item.id,
    ownerId: item.user_id,
    productId: item.product_id,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    isActive: item.is_active,
    lastKnownPrice: Number(item.last_known_price ?? 0),
    targetPrice: item.alert_config.target_price == null ? null : Number(item.alert_config.target_price),
    notifyOnPriceDrop: item.alert_config.notify_on_price_drop,
    notifyOnNewBestOffer: item.alert_config.notify_on_new_best_offer,
    lastTriggeredAt: item.alert_config.last_triggered_at ?? undefined
  };
}

export const anonymousSyncService = {
  async syncAnonymousState(
    token: string,
    payload: {
      anonymousSessionId: string;
      favorites: Favorite[];
      compareList: CartItem[];
      priceWatches: PriceWatch[];
    }
  ): Promise<ApiResponse<AnonymousSyncResult>> {
    const response = await apiClient.post<BackendSyncResponse>(
      "/sync/anonymous",
      {
        anonymous_session_id: payload.anonymousSessionId,
        favorites: payload.favorites.map((item) => ({
          product_id: item.productId,
          created_at: item.createdAt
        })),
        compare_list: payload.compareList.map((item) => ({
          product_id: item.productId,
          offer_id: item.offerId,
          quantity: item.quantity,
          added_at: item.addedAt
        })),
        price_watches: payload.priceWatches.map((item) => ({
          product_id: item.productId,
          is_active: item.isActive,
          last_known_price: item.lastKnownPrice,
          target_price: item.targetPrice,
          notify_on_price_drop: item.notifyOnPriceDrop,
          notify_on_new_best_offer: item.notifyOnNewBestOffer,
          last_triggered_at: item.lastTriggeredAt ?? null,
          updated_at: item.updatedAt
        }))
      },
      { token }
    );

    if (!response.ok) {
      return response;
    }

    return {
      ...response,
      data: {
        favorites: response.data.favorites.map(mapFavorite),
        compareList: response.data.compare_list.map(mapCompareListItem),
        priceWatches: response.data.price_watches.map(mapPriceWatch)
      }
    };
  }
};
