"use client";

import { useMemo } from "react";

import { useAuthStore, useCartStore } from "@/stores";
import { getPreferenceOwnerId } from "@/shared/lib/identity";


type CompareListButtonProps = {
  productId: string;
  offerId: string;
  unitPrice: number;
  variant?: "compact" | "full";
};

export function CompareListButton({
  productId,
  offerId,
  unitPrice,
  variant = "compact"
}: CompareListButtonProps) {
  const session = useAuthStore((state) => state.session);
  const addItem = useCartStore((state) => state.addItem);
  const ownerId = useMemo(() => getPreferenceOwnerId(session), [session]);
  const active = useCartStore((state) =>
    state.carts.some((cart) => cart.ownerId === ownerId && cart.items.some((item) => item.productId === productId))
  );

  return (
    <button
      type="button"
      onClick={() =>
        void
        addItem({
          ownerId,
          productId,
          offerId,
          unitPrice,
          quantity: 1
        })
      }
      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-lagoon text-white hover:bg-teal-700"
          : "bg-ink text-white hover:bg-neutral-800"
      } ${variant === "full" ? "w-full md:w-auto" : ""}`}
    >
      {active ? "No carrinho" : "Adicionar ao carrinho"}
    </button>
  );
}
