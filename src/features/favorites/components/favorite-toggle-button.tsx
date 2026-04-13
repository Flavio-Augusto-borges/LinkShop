"use client";

import { useMemo } from "react";

import { useAuthStore, useFavoritesStore } from "@/stores";
import { getPreferenceOwnerId } from "@/shared/lib/identity";

type FavoriteToggleButtonProps = {
  productId: string;
  variant?: "compact" | "full" | "icon";
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
      className={`inline-flex items-center justify-center rounded-full text-sm font-semibold transition ${
        variant === "icon"
          ? active
            ? "h-9 w-9 bg-gold/90 text-ink hover:bg-gold"
            : "h-9 w-9 bg-white/90 text-neutral-600 hover:bg-white"
          : active
            ? "bg-coral px-4 py-2 text-white hover:bg-orange-600"
            : "bg-black/5 px-4 py-2 text-ink hover:bg-black/10"
      } ${variant === "full" ? "w-full md:w-auto" : ""}`}
      aria-pressed={active}
      aria-label={active ? "Remover dos favoritos" : "Salvar nos favoritos"}
    >
      {variant === "icon" ? (
        <span aria-hidden>{active ? "\u2605" : "\u2606"}</span>
      ) : active ? (
        "Salvo nos favoritos"
      ) : (
        "Salvar favorito"
      )}
    </button>
  );
}
