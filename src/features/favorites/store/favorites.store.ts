"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { favoritesService } from "@/features/favorites/services/favorites.service";
import type { Favorite } from "@/features/favorites/types/favorite.types";
import { getStoredAccessToken } from "@/shared/api/session-token";
import { ANONYMOUS_OWNER_ID } from "@/shared/lib/identity";
import { createSafeStorage } from "@/shared/lib/persistence";
import { safeUUID } from "@/shared/lib/uuid";

function shouldUseBackend(userId: string) {
  return userId !== ANONYMOUS_OWNER_ID && Boolean(getStoredAccessToken());
}

function replaceFavoritesForUser(favorites: Favorite[], userId: string, nextFavorites: Favorite[]) {
  return [...favorites.filter((favorite) => favorite.userId !== userId), ...nextFavorites];
}

type FavoritesState = {
  favorites: Favorite[];
  addFavorite: (payload: { userId: string; productId: string }) => Promise<void>;
  removeFavorite: (payload: { userId: string; productId: string }) => Promise<void>;
  toggleFavorite: (payload: { userId: string; productId: string }) => Promise<void>;
  isFavorite: (payload: { userId: string; productId: string }) => boolean;
  getFavoritesByUser: (userId: string) => Favorite[];
  hydrateFavorites: (payload: { userId: string; favorites: Favorite[] }) => void;
  syncFavorites: (payload: { userId: string }) => Promise<void>;
  mergeFavorites: (payload: { sourceUserId: string; targetUserId: string }) => void;
  clearFavoritesByUser: (userId: string) => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: async ({ userId, productId }) => {
        if (shouldUseBackend(userId)) {
          const token = getStoredAccessToken();

          if (token) {
            const response = await favoritesService.addFavorite(token, productId);

            if (response.ok) {
              set((state) => ({
                favorites: replaceFavoritesForUser(
                  state.favorites,
                  userId,
                  [...get().getFavoritesByUser(userId).filter((favorite) => favorite.productId !== productId), response.data]
                )
              }));
            }

            return;
          }
        }

        set((state) => {
          const exists = state.favorites.some(
            (favorite) => favorite.userId === userId && favorite.productId === productId
          );

          if (exists) {
            return state;
          }

          return {
            favorites: [
              ...state.favorites,
              {
                id: safeUUID(),
                userId,
                productId,
                createdAt: new Date().toISOString()
              }
            ]
          };
        });
      },
      removeFavorite: async ({ userId, productId }) => {
        if (shouldUseBackend(userId)) {
          const token = getStoredAccessToken();

          if (token) {
            const response = await favoritesService.removeFavorite(token, productId);

            if (response.ok) {
              set((state) => ({
                favorites: state.favorites.filter(
                  (favorite) => !(favorite.userId === userId && favorite.productId === productId)
                )
              }));
            }

            return;
          }
        }

        set((state) => ({
          favorites: state.favorites.filter(
            (favorite) => !(favorite.userId === userId && favorite.productId === productId)
          )
        }));
      },
      toggleFavorite: async ({ userId, productId }) => {
        const exists = get().favorites.some(
          (favorite) => favorite.userId === userId && favorite.productId === productId
        );

        if (exists) {
          await get().removeFavorite({ userId, productId });
          return;
        }

        await get().addFavorite({ userId, productId });
      },
      isFavorite: ({ userId, productId }) =>
        get().favorites.some((favorite) => favorite.userId === userId && favorite.productId === productId),
      getFavoritesByUser: (userId) =>
        get().favorites.filter((favorite) => favorite.userId === userId),
      hydrateFavorites: ({ userId, favorites }) =>
        set((state) => ({
          favorites: replaceFavoritesForUser(state.favorites, userId, favorites)
        })),
      syncFavorites: async ({ userId }) => {
        if (!shouldUseBackend(userId)) {
          return;
        }

        const token = getStoredAccessToken();

        if (!token) {
          return;
        }

        const remoteResponse = await favoritesService.listFavorites(token);

        if (!remoteResponse.ok) {
          return;
        }

        set((state) => ({
          favorites: replaceFavoritesForUser(state.favorites, userId, remoteResponse.data)
        }));
      },
      mergeFavorites: ({ sourceUserId, targetUserId }) =>
        set((state) => {
          if (sourceUserId === targetUserId) {
            return state;
          }

          const sourceFavorites = state.favorites.filter((favorite) => favorite.userId === sourceUserId);
          const targetFavorites = state.favorites.filter((favorite) => favorite.userId === targetUserId);
          const mergedByProductId = new Map<string, Favorite>();

          [...targetFavorites, ...sourceFavorites].forEach((favorite) => {
            if (!mergedByProductId.has(favorite.productId)) {
              mergedByProductId.set(favorite.productId, {
                ...favorite,
                id: safeUUID(),
                userId: targetUserId
              });
            }
          });

          const untouchedFavorites = state.favorites.filter(
            (favorite) => favorite.userId !== sourceUserId && favorite.userId !== targetUserId
          );

          return {
            favorites: [...untouchedFavorites, ...mergedByProductId.values()]
          };
        }),
      clearFavoritesByUser: (userId) =>
        set((state) => ({
          favorites: state.favorites.filter((favorite) => favorite.userId !== userId)
        }))
    }),
    {
      name: "linkshop-favorites",
      storage: createSafeStorage()
    }
  )
);
