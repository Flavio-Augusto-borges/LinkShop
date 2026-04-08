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
      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-gold text-ink hover:bg-yellow-400" : "bg-black/5 text-ink hover:bg-black/10"
      } ${variant === "full" ? "w-full md:w-auto" : ""}`}
      aria-pressed={active}
    >
      {active ? "Acompanhando preco" : "Acompanhar preco"}
    </button>
  );
}
