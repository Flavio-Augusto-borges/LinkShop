"use client";

import { create } from "zustand";

import type { CatalogFilters, CatalogItem } from "@/features/catalog/types/catalog.types";

const defaultFilters: CatalogFilters = {
  query: "",
  category: "",
  storeId: "",
  minPrice: null,
  maxPrice: null,
  minDiscount: 0,
  sort: "relevance"
};

type CatalogState = {
  items: CatalogItem[];
  availableCategories: string[];
  filters: CatalogFilters;
  total: number;
  initialized: boolean;
  initializeCatalog: (payload: {
    items: CatalogItem[];
    availableCategories: string[];
    total: number;
    filters?: CatalogFilters;
  }) => void;
  setQuery: (query: string) => void;
  setCategory: (category: string) => void;
  setStoreId: (storeId: CatalogFilters["storeId"]) => void;
  setMinPrice: (value: number | null) => void;
  setMaxPrice: (value: number | null) => void;
  setMinDiscount: (value: number) => void;
  setSort: (sort: CatalogFilters["sort"]) => void;
  upsertCatalogItem: (item: CatalogItem) => void;
  removeCatalogItem: (productId: string) => void;
  resetFilters: () => void;
};

function deriveCategories(items: CatalogItem[]) {
  return [...new Set(items.map((item) => item.product.category))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export const useCatalogStore = create<CatalogState>()((set) => ({
  items: [],
  availableCategories: [],
  filters: defaultFilters,
  total: 0,
  initialized: false,
  initializeCatalog: ({ items, availableCategories, total, filters }) =>
    set({
      items,
      availableCategories,
      total,
      filters: filters ?? defaultFilters,
      initialized: true
    }),
  setQuery: (query) =>
    set((state) => ({
      filters: {
        ...state.filters,
        query
      }
    })),
  setCategory: (category) =>
    set((state) => ({
      filters: {
        ...state.filters,
        category
      }
    })),
  setStoreId: (storeId) =>
    set((state) => ({
      filters: {
        ...state.filters,
        storeId
      }
    })),
  setMinPrice: (minPrice) =>
    set((state) => ({
      filters: {
        ...state.filters,
        minPrice
      }
    })),
  setMaxPrice: (maxPrice) =>
    set((state) => ({
      filters: {
        ...state.filters,
        maxPrice
      }
    })),
  setMinDiscount: (minDiscount) =>
    set((state) => ({
      filters: {
        ...state.filters,
        minDiscount
      }
    })),
  setSort: (sort) =>
    set((state) => ({
      filters: {
        ...state.filters,
        sort
      }
    })),
  upsertCatalogItem: (item) =>
    set((state) => {
      const index = state.items.findIndex((current) => current.product.id === item.product.id);
      const nextItems = [...state.items];

      if (index === -1) {
        nextItems.unshift(item);
      } else {
        nextItems[index] = item;
      }

      return {
        items: nextItems,
        total: nextItems.length,
        availableCategories: deriveCategories(nextItems)
      };
    }),
  removeCatalogItem: (productId) =>
    set((state) => {
      const nextItems = state.items.filter((item) => item.product.id !== productId);

      return {
        items: nextItems,
        total: nextItems.length,
        availableCategories: deriveCategories(nextItems)
      };
    }),
  resetFilters: () =>
    set((state) => ({
      filters: {
        ...defaultFilters,
        query: state.filters.query
      }
    }))
}));
