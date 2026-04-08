import { storesMockRepository } from "@/features/product/data/stores.mock-repository";
import type { Store, StoreId } from "@/features/product/types/store.types";
import { apiClient } from "@/shared/api/api-client";
import { isBackendIntegrationEnabled } from "@/shared/api/api-config";
import { mockSuccess } from "@/shared/lib/async";
import type { ApiResponse } from "@/shared/types/api.types";

type BackendStore = {
  id: string;
  code: StoreId;
  name: string;
  affiliate_network: Store["affiliateNetwork"];
  is_active: boolean;
};

function mapBackendStore(store: BackendStore): Store {
  return {
    id: store.code,
    name: store.name,
    slug: store.code,
    affiliateNetwork: store.affiliate_network,
    isActive: store.is_active
  };
}

export const storesService = {
  async listStores(): Promise<ApiResponse<Store[]>> {
    if (isBackendIntegrationEnabled()) {
      const response = await apiClient.get<BackendStore[]>("/stores");

      if (!response.ok) {
        return response;
      }

      return {
        ...response,
        data: response.data.map(mapBackendStore)
      };
    }

    const stores = storesMockRepository.listStores().filter((store) => store.isActive);
    return mockSuccess(stores);
  },

  async getStoreById(storeId: StoreId): Promise<ApiResponse<Store | null>> {
    if (isBackendIntegrationEnabled()) {
      const response = await this.listStores();

      if (!response.ok) {
        return response;
      }

      return {
        ...response,
        data: response.data.find((entry) => entry.id === storeId && entry.isActive) ?? null
      };
    }

    const store = storesMockRepository.listStores().find((entry) => entry.id === storeId && entry.isActive) ?? null;
    return mockSuccess(store);
  }
};
