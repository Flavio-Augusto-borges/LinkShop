"use client";

import { useMemo } from "react";

import { useAuthStore, usePriceWatchStore } from "@/stores";
import { getPreferenceOwnerId } from "@/shared/lib/identity";

type PriceWatchToggleButtonProps = {
  productId: string;
  currentPrice: number;
  variant?: "compact" | "full";
};

export function PriceWatchToggleButton({
  productId,
  currentPrice,
  variant = "compact"
}: PriceWatchToggleButtonProps) {
  const session = useAuthStore((state) => state.session);
  const toggleWatch = usePriceWatchStore((state) => state.toggleWatch);
  const ownerId = useMemo(() => getPreferenceOwnerId(session), [session]);
  const active = usePriceWatchStore((state) =>
    state.watches.some((watch) => watch.ownerId === ownerId && watch.productId === productId && watch.isActive)
  );

  return (
    <button
      type="button"
      onClick={() => void toggleWatch({ ownerId, productId, currentPrice })}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35 ${
        variant === "full"
          ? active
            ? "border border-gold/40 bg-gold px-4 py-3 text-ink shadow-[0_12px_24px_rgba(255,214,10,0.18)] hover:bg-yellow-300"
            : "border border-coral/25 bg-coral/10 px-4 py-3 text-coral shadow-[0_12px_24px_rgba(255,107,61,0.14)] hover:bg-coral/15"
          : active
            ? "bg-gold text-ink hover:bg-yellow-400"
            : "bg-black/5 text-ink hover:bg-black/10"
      } ${variant === "full" ? "w-full md:w-auto" : ""}`}
      aria-pressed={active}
    >
      <span aria-hidden>{active ? "\u25cf" : "\u25cb"}</span>
      <span>{active ? "Acompanhando preco" : "Acompanhar preco"}</span>
    </button>
  );
}
