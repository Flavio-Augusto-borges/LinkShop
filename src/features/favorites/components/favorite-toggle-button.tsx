"use client";

import { useMemo } from "react";

import { useAuthStore, useFavoritesStore } from "@/stores";
import { getPreferenceOwnerId } from "@/shared/lib/identity";

type FavoriteToggleButtonProps = {
  productId: string;
  variant?: "compact" | "full";
};

export function FavoriteToggleButton({ productId, variant = "compact" }: FavoriteToggleButtonProps) {
  const session = useAuthStore((state) => state.session);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const ownerId = useMemo(() => getPreferenceOwnerId(session), [session]);
  const active = useFavoritesStore((state) =>
    state.favorites.some((favorite) => favorite.userId === ownerId && favorite.productId === productId)
  );

  return (
    <button
      type="button"
      onClick={() => void toggleFavorite({ userId: ownerId, productId })}
      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-coral text-white hover:bg-orange-600"
          : "bg-black/5 text-ink hover:bg-black/10"
      } ${variant === "full" ? "w-full md:w-auto" : ""}`}
      aria-pressed={active}
    >
      {active ? "Salvo nos favoritos" : "Salvar favorito"}
    </button>
  );
}
