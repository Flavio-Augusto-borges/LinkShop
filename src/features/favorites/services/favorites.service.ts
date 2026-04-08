import type { Favorite } from "@/features/favorites/types/favorite.types";
import { apiClient } from "@/shared/api/api-client";
import type { ApiResponse } from "@/shared/types/api.types";

type BackendFavorite = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

function mapBackendFavorite(favorite: BackendFavorite): Favorite {
  return {
    id: favorite.id,
    userId: favorite.user_id,
    productId: favorite.product_id,
    createdAt: favorite.created_at
  };
}

export const favoritesService = {
  async listFavorites(token: string): Promise<ApiResponse<Favorite[]>> {
    const response = await apiClient.get<BackendFavorite[]>("/me/favorites", { token });

    if (!response.ok) {
      return response;
    }

    return {
      ...response,
      data: response.data.map(mapBackendFavorite)
    };
  },

  async addFavorite(token: string, productId: string): Promise<ApiResponse<Favorite>> {
    const response = await apiClient.post<BackendFavorite>("/me/favorites", { product_id: productId }, { token });

    if (!response.ok) {
      return response;
    }

    return {
      ...response,
      data: mapBackendFavorite(response.data)
    };
  },

  async removeFavorite(token: string, productId: string): Promise<ApiResponse<{ success: true }>> {
    const response = await apiClient.delete<null>(`/me/favorites/${productId}`, { token });

    if (!response.ok) {
      return response;
    }

    return {
      ...response,
      data: { success: true }
    };
  }
};
