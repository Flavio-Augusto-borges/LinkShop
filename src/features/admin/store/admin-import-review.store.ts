"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { adminCatalogService } from "@/features/admin/services/admin-catalog.service";
import type { AdminImportReviewDraft, AdminImportedProduct, AdminProductDraft } from "@/features/admin/types/admin.types";
import { createSafeStorage } from "@/shared/lib/persistence";
import { safeUUID } from "@/shared/lib/uuid";

type AdminImportReviewState = {
  drafts: AdminImportReviewDraft[];
  addDraftFromImport: (payload: { sourceUrl: string; imported: AdminImportedProduct }) => string;
  updateDraft: (payload: { draftId: string; draft: AdminProductDraft }) => void;
  removeDraft: (draftId: string) => void;
  clearDrafts: () => void;
};

export const useAdminImportReviewStore = create<AdminImportReviewState>()(
  persist(
    (set) => ({
      drafts: [],
      addDraftFromImport: ({ sourceUrl, imported }) => {
        const draftId = safeUUID();
        const reviewDraft: AdminImportReviewDraft = {
          id: draftId,
          createdAt: new Date().toISOString(),
          sourceUrl,
          resolvedUrl: imported.resolvedUrl,
          provider: imported.provider,
          draft: adminCatalogService.buildDraftFromImport(imported)
        };

        set((state) => ({
          drafts: [reviewDraft, ...state.drafts]
        }));

        return draftId;
      },
      updateDraft: ({ draftId, draft }) =>
        set((state) => ({
          drafts: state.drafts.map((entry) => (entry.id === draftId ? { ...entry, draft } : entry))
        })),
      removeDraft: (draftId) =>
        set((state) => ({
          drafts: state.drafts.filter((entry) => entry.id !== draftId)
        })),
      clearDrafts: () => set({ drafts: [] })
    }),
    {
      name: "linkshop-admin-import-review",
      storage: createSafeStorage()
    }
  )
);
