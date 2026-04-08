"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { priceWatchService } from "@/features/price-alerts/services/price-watch.service";
import type { PriceWatch } from "@/features/price-alerts/types/price-watch.types";
import { getStoredAccessToken } from "@/shared/api/session-token";
import { ANONYMOUS_OWNER_ID } from "@/shared/lib/identity";
import { createSafeStorage } from "@/shared/lib/persistence";

function shouldUseBackend(ownerId: string) {
  return ownerId !== ANONYMOUS_OWNER_ID && Boolean(getStoredAccessToken());
}

function replaceWatchesForOwner(watches: PriceWatch[], ownerId: string, nextWatches: PriceWatch[]) {
  return [...watches.filter((watch) => watch.ownerId !== ownerId), ...nextWatches];
}

type PriceWatchState = {
  watches: PriceWatch[];
  toggleWatch: (payload: { ownerId: string; productId: string; currentPrice: number }) => Promise<void>;
  updateWatchPrice: (payload: { ownerId: string; productId: string; currentPrice: number }) => void;
  upsertWatchSettings: (payload: {
    ownerId: string;
    productId: string;
    currentPrice: number;
    targetPrice: number | null;
    notifyOnPriceDrop: boolean;
    notifyOnNewBestOffer: boolean;
    isActive?: boolean;
  }) => Promise<void>;
  removeWatch: (payload: { ownerId: string; productId: string }) => Promise<void>;
  isWatching: (payload: { ownerId: string; productId: string }) => boolean;
  getWatchesByOwner: (ownerId: string) => PriceWatch[];
  hydrateWatches: (payload: { ownerId: string; watches: PriceWatch[] }) => void;
  syncWatches: (payload: { ownerId: string }) => Promise<void>;
  mergeWatches: (payload: { sourceOwnerId: string; targetOwnerId: string }) => void;
  clearWatchesByOwner: (ownerId: string) => void;
};

export const usePriceWatchStore = create<PriceWatchState>()(
  persist(
    (set, get) => ({
      watches: [],
      toggleWatch: async ({ ownerId, productId, currentPrice }) => {
        if (shouldUseBackend(ownerId)) {
          const token = getStoredAccessToken();

          if (token) {
            const current = get().watches.find((watch) => watch.ownerId === ownerId && watch.productId === productId);

            if (!current) {
              const response = await priceWatchService.createPriceWatch(token, {
                productId,
                targetPrice: null,
                notifyOnPriceDrop: true,
                notifyOnNewBestOffer: true
              });

              if (response.ok) {
                set((state) => ({
                  watches: [...state.watches.filter((watch) => !(watch.ownerId === ownerId && watch.productId === productId)), response.data]
                }));
              }

              return;
            }

            const response = await priceWatchService.updatePriceWatch(token, {
              watchId: current.id,
              isActive: !current.isActive
            });

            if (response.ok) {
              set((state) => ({
                watches: state.watches.map((watch) => (watch.id === current.id ? response.data : watch))
              }));
            }

            return;
          }
        }

        set((state) => {
          const current = state.watches.find((watch) => watch.ownerId === ownerId && watch.productId === productId);

          if (!current) {
            return {
              watches: [...state.watches, priceWatchService.createWatch({ ownerId, productId, currentPrice })]
            };
          }

          return {
            watches: state.watches.map((watch) =>
              watch.id === current.id
                ? {
                    ...watch,
                    isActive: !watch.isActive,
                    lastKnownPrice: currentPrice,
                    updatedAt: new Date().toISOString()
                  }
                : watch
            )
          };
        });
      },
      updateWatchPrice: ({ ownerId, productId, currentPrice }) =>
        set((state) => ({
          watches: state.watches.map((watch) =>
            watch.ownerId === ownerId && watch.productId === productId
              ? {
                  ...watch,
                  lastKnownPrice: currentPrice,
                  updatedAt: new Date().toISOString()
                }
              : watch
          )
        })),
      upsertWatchSettings: async ({
        ownerId,
        productId,
        currentPrice,
        targetPrice,
        notifyOnPriceDrop,
        notifyOnNewBestOffer,
        isActive = true
      }) => {
        if (shouldUseBackend(ownerId)) {
          const token = getStoredAccessToken();

          if (token) {
            const current = get().watches.find((watch) => watch.ownerId === ownerId && watch.productId === productId);

            if (!current) {
              const response = await priceWatchService.createPriceWatch(token, {
                productId,
                targetPrice,
                notifyOnPriceDrop,
                notifyOnNewBestOffer
              });

              if (response.ok) {
                const nextWatch = priceWatchService.applySettings(response.data, {
                  currentPrice,
                  targetPrice,
                  notifyOnPriceDrop,
                  notifyOnNewBestOffer,
                  isActive
                });

                set((state) => ({
                  watches: [...state.watches.filter((watch) => !(watch.ownerId === ownerId && watch.productId === productId)), nextWatch]
                }));
              }

              return;
            }

            const response = await priceWatchService.updatePriceWatch(token, {
              watchId: current.id,
              isActive,
              targetPrice,
              notifyOnPriceDrop,
              notifyOnNewBestOffer
            });

            if (response.ok) {
              const nextWatch = priceWatchService.applySettings(response.data, {
                currentPrice,
                targetPrice,
                notifyOnPriceDrop,
                notifyOnNewBestOffer,
                isActive
              });

              set((state) => ({
                watches: state.watches.map((watch) => (watch.id === current.id ? nextWatch : watch))
              }));
            }

            return;
          }
        }

        set((state) => {
          const current = state.watches.find((watch) => watch.ownerId === ownerId && watch.productId === productId);

          if (!current) {
            const created = priceWatchService.applySettings(
              priceWatchService.createWatch({ ownerId, productId, currentPrice }),
              {
                currentPrice,
                targetPrice,
                notifyOnPriceDrop,
                notifyOnNewBestOffer,
                isActive
              }
            );

            return {
              watches: [...state.watches, created]
            };
          }

          return {
            watches: state.watches.map((watch) =>
              watch.id === current.id
                ? priceWatchService.applySettings(watch, {
                    currentPrice,
                    targetPrice,
                    notifyOnPriceDrop,
                    notifyOnNewBestOffer,
                    isActive
                  })
                : watch
            )
          };
        });
      },
      removeWatch: async ({ ownerId, productId }) => {
        if (shouldUseBackend(ownerId)) {
          const token = getStoredAccessToken();
          const current = get().watches.find((watch) => watch.ownerId === ownerId && watch.productId === productId);

          if (token && current) {
            const response = await priceWatchService.removePriceWatch(token, current.id);

            if (response.ok) {
              set((state) => ({
                watches: state.watches.filter(
                  (watch) => !(watch.ownerId === ownerId && watch.productId === productId)
                )
              }));
            }

            return;
          }
        }

        set((state) => ({
          watches: state.watches.filter(
            (watch) => !(watch.ownerId === ownerId && watch.productId === productId)
          )
        }));
      },
      isWatching: ({ ownerId, productId }) =>
        get().watches.some((watch) => watch.ownerId === ownerId && watch.productId === productId && watch.isActive),
      getWatchesByOwner: (ownerId) => get().watches.filter((watch) => watch.ownerId === ownerId && watch.isActive),
      hydrateWatches: ({ ownerId, watches }) =>
        set((state) => ({
          watches: replaceWatchesForOwner(state.watches, ownerId, watches)
        })),
      syncWatches: async ({ ownerId }) => {
        if (!shouldUseBackend(ownerId)) {
          return;
        }

        const token = getStoredAccessToken();

        if (!token) {
          return;
        }

        const remoteResponse = await priceWatchService.listPriceWatches(token);

        if (!remoteResponse.ok) {
          return;
        }

        set((state) => ({
          watches: replaceWatchesForOwner(state.watches, ownerId, remoteResponse.data)
        }));
      },
      mergeWatches: ({ sourceOwnerId, targetOwnerId }) =>
        set((state) => ({
          watches: priceWatchService.mergeWatches(state.watches, sourceOwnerId, targetOwnerId)
        })),
      clearWatchesByOwner: (ownerId) =>
        set((state) => ({
          watches: state.watches.filter((watch) => watch.ownerId !== ownerId)
        }))
    }),
    {
      name: "linkshop-price-watches",
      storage: createSafeStorage()
    }
  )
);
