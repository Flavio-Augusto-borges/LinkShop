import type { PriceWatch } from "@/features/price-alerts/types/price-watch.types";
import { apiClient } from "@/shared/api/api-client";
import { safeUUID } from "@/shared/lib/uuid";
import type { ApiResponse } from "@/shared/types/api.types";

type BackendPriceWatch = {
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
};

function mapBackendWatch(watch: BackendPriceWatch): PriceWatch {
  return {
    id: watch.id,
    ownerId: watch.user_id,
    productId: watch.product_id,
    createdAt: watch.created_at,
    updatedAt: watch.updated_at,
    isActive: watch.is_active,
    lastKnownPrice: Number(watch.last_known_price ?? 0),
    targetPrice: watch.alert_config.target_price == null ? null : Number(watch.alert_config.target_price),
    notifyOnPriceDrop: watch.alert_config.notify_on_price_drop,
    notifyOnNewBestOffer: watch.alert_config.notify_on_new_best_offer,
    lastTriggeredAt: watch.alert_config.last_triggered_at ?? undefined
  };
}

export const priceWatchService = {
  async listPriceWatches(token: string): Promise<ApiResponse<PriceWatch[]>> {
    const response = await apiClient.get<BackendPriceWatch[]>("/me/price-watches", { token });

    if (!response.ok) {
      return response;
    }

    return {
      ...response,
      data: response.data.map(mapBackendWatch)
    };
  },

  async createPriceWatch(
    token: string,
    payload: {
      productId: string;
      targetPrice: number | null;
      notifyOnPriceDrop: boolean;
      notifyOnNewBestOffer: boolean;
    }
  ): Promise<ApiResponse<PriceWatch>> {
    const response = await apiClient.post<BackendPriceWatch>(
      "/me/price-watches",
      {
        product_id: payload.productId,
        target_price: payload.targetPrice,
        notify_on_price_drop: payload.notifyOnPriceDrop,
        notify_on_new_best_offer: payload.notifyOnNewBestOffer
      },
      { token }
    );

    if (!response.ok) {
      return response;
    }

    return {
      ...response,
      data: mapBackendWatch(response.data)
    };
  },

  async updatePriceWatch(
    token: string,
    payload: {
      watchId: string;
      isActive?: boolean;
      targetPrice?: number | null;
      notifyOnPriceDrop?: boolean;
      notifyOnNewBestOffer?: boolean;
    }
  ): Promise<ApiResponse<PriceWatch>> {
    const response = await apiClient.patch<BackendPriceWatch>(
      `/me/price-watches/${payload.watchId}`,
      {
        ...(payload.isActive !== undefined ? { is_active: payload.isActive } : {}),
        ...(payload.targetPrice !== undefined ? { target_price: payload.targetPrice } : {}),
        ...(payload.notifyOnPriceDrop !== undefined ? { notify_on_price_drop: payload.notifyOnPriceDrop } : {}),
        ...(payload.notifyOnNewBestOffer !== undefined
          ? { notify_on_new_best_offer: payload.notifyOnNewBestOffer }
          : {})
      },
      { token }
    );

    if (!response.ok) {
      return response;
    }

    return {
      ...response,
      data: mapBackendWatch(response.data)
    };
  },

  async removePriceWatch(token: string, watchId: string): Promise<ApiResponse<{ success: true }>> {
    const response = await apiClient.delete<null>(`/me/price-watches/${watchId}`, { token });

    if (!response.ok) {
      return response;
    }

    return {
      ...response,
      data: { success: true }
    };
  },

  createWatch(payload: { ownerId: string; productId: string; currentPrice: number }): PriceWatch {
    const timestamp = new Date().toISOString();

    return {
      id: safeUUID(),
      ownerId: payload.ownerId,
      productId: payload.productId,
      createdAt: timestamp,
      updatedAt: timestamp,
      isActive: true,
      lastKnownPrice: payload.currentPrice,
      targetPrice: null,
      notifyOnPriceDrop: true,
      notifyOnNewBestOffer: true
    };
  },

  mergeWatches(watches: PriceWatch[], sourceOwnerId: string, targetOwnerId: string) {
    if (sourceOwnerId === targetOwnerId) {
      return watches;
    }

    const source = watches.filter((watch) => watch.ownerId === sourceOwnerId);
    const target = watches.filter((watch) => watch.ownerId === targetOwnerId);
    const mergedByProductId = new Map<string, PriceWatch>();

    [...target, ...source].forEach((watch) => {
      const current = mergedByProductId.get(watch.productId);

      if (!current) {
        mergedByProductId.set(watch.productId, {
          ...watch,
          id: safeUUID(),
          ownerId: targetOwnerId
        });
        return;
      }

      const incomingUpdatedAt = new Date(watch.updatedAt).getTime();
      const currentUpdatedAt = new Date(current.updatedAt).getTime();
      const shouldReplace = incomingUpdatedAt >= currentUpdatedAt;

      mergedByProductId.set(watch.productId, {
        ...current,
        ownerId: targetOwnerId,
        isActive: current.isActive || watch.isActive,
        lastKnownPrice: shouldReplace ? watch.lastKnownPrice : current.lastKnownPrice,
        targetPrice: current.targetPrice ?? watch.targetPrice,
        notifyOnPriceDrop: current.notifyOnPriceDrop || watch.notifyOnPriceDrop,
        notifyOnNewBestOffer: current.notifyOnNewBestOffer || watch.notifyOnNewBestOffer,
        updatedAt: shouldReplace ? watch.updatedAt : current.updatedAt,
        lastTriggeredAt: current.lastTriggeredAt ?? watch.lastTriggeredAt
      });
    });

    const untouched = watches.filter((watch) => watch.ownerId !== sourceOwnerId && watch.ownerId !== targetOwnerId);
    return [...untouched, ...mergedByProductId.values()];
  },

  evaluateWatchStatus(watch: PriceWatch, currentPrice: number) {
    const hasDropped = currentPrice < watch.lastKnownPrice;
    const targetReached = watch.targetPrice !== null ? currentPrice <= watch.targetPrice : false;

    return {
      hasDropped,
      targetReached,
      currentPrice,
      difference: currentPrice - watch.lastKnownPrice
    };
  },

  applySettings(
    watch: PriceWatch,
    payload: {
      currentPrice: number;
      targetPrice: number | null;
      notifyOnPriceDrop: boolean;
      notifyOnNewBestOffer: boolean;
      isActive?: boolean;
    }
  ): PriceWatch {
    return {
      ...watch,
      lastKnownPrice: payload.currentPrice,
      targetPrice: payload.targetPrice,
      notifyOnPriceDrop: payload.notifyOnPriceDrop,
      notifyOnNewBestOffer: payload.notifyOnNewBestOffer,
      isActive: payload.isActive ?? watch.isActive,
      updatedAt: new Date().toISOString()
    };
  },

  mergeWatchCollections(targetOwnerId: string, remote: PriceWatch[], local: PriceWatch[]) {
    return this.mergeWatches(
      [
        ...remote.map((watch) => ({ ...watch, ownerId: targetOwnerId })),
        ...local.map((watch) => ({ ...watch, ownerId: "source-owner" }))
      ],
      "source-owner",
      targetOwnerId
    ).filter((watch) => watch.ownerId === targetOwnerId);
  }
};
