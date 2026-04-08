"use client";

import { createJSONStorage, type StateStorage } from "zustand/middleware";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined
};

export function createSafeStorage() {
  return createJSONStorage(() => {
    if (typeof window === "undefined") {
      return noopStorage;
    }

    return window.localStorage;
  });
}
