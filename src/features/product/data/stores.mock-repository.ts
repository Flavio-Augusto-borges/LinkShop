import { mockStores } from "@/features/product/data/mock-stores";
import type { Store } from "@/features/product/types/store.types";

export const storesMockRepository = {
  listStores(): Store[] {
    return [...mockStores];
  }
};
