"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuthStore, usePriceWatchStore } from "@/stores";
import { getPreferenceOwnerId } from "@/shared/lib/identity";

type PriceWatchSettingsCardProps = {
  productId: string;
  productName?: string;
  currentPrice: number;
  variant?: "product" | "account";
};

export function PriceWatchSettingsCard({
  productId,
  productName,
  currentPrice,
  variant = "product"
}: PriceWatchSettingsCardProps) {
  const session = useAuthStore((state) => state.session);
  const ownerId = useMemo(() => getPreferenceOwnerId(session), [session]);
  const watch = usePriceWatchStore((state) =>
    state.watches.find((entry) => entry.ownerId === ownerId && entry.productId === productId)
  );
  const upsertWatchSettings = usePriceWatchStore((state) => state.upsertWatchSettings);
  const removeWatch = usePriceWatchStore((state) => state.removeWatch);
  const [targetPrice, setTargetPrice] = useState("");
  const [notifyOnPriceDrop, setNotifyOnPriceDrop] = useState(true);
  const [notifyOnNewBestOffer, setNotifyOnNewBestOffer] = useState(true);

  useEffect(() => {
    setTargetPrice(watch?.targetPrice ? String(watch.targetPrice) : "");
    setNotifyOnPriceDrop(watch?.notifyOnPriceDrop ?? true);
    setNotifyOnNewBestOffer(watch?.notifyOnNewBestOffer ?? true);
  }, [watch]);

  function saveSettings() {
    void upsertWatchSettings({
      ownerId,
      productId,
      currentPrice,
      targetPrice: targetPrice ? Number(targetPrice) : null,
      notifyOnPriceDrop,
      notifyOnNewBestOffer,
      isActive: true
    });
  }

  return (
    <div className={`rounded-[1.5rem] ${variant === "product" ? "bg-black/5 p-5" : "bg-neutral-100 p-4"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-coral">Alerta de preco</p>
          <h4 className="mt-2 font-display text-2xl">
            {productName ? `Configurar ${productName}` : "Configurar acompanhamento"}
          </h4>
        </div>
        {watch?.isActive ? (
          <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-ink">Ativo</span>
        ) : (
          <span className="rounded-full bg-black/10 px-3 py-1 text-xs font-bold text-neutral-600">Inativo</span>
        )}
      </div>

      <div className="mt-4 grid gap-4">
        <label className="grid gap-2 text-sm text-neutral-600">
          Preco-alvo
          <input
            type="number"
            min={0}
            step="0.01"
            value={targetPrice}
            onChange={(event) => setTargetPrice(event.target.value)}
            placeholder="Ex.: 2999.90"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-coral/40"
          />
        </label>

        <label className="flex items-start gap-3 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={notifyOnPriceDrop}
            onChange={(event) => setNotifyOnPriceDrop(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-black/20"
          />
          <span>Manter alerta para queda de preco</span>
        </label>

        <label className="flex items-start gap-3 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={notifyOnNewBestOffer}
            onChange={(event) => setNotifyOnNewBestOffer(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-black/20"
          />
          <span>Manter alerta para nova melhor oferta</span>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveSettings}
          className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          {watch?.isActive ? "Salvar configuracao" : "Ativar acompanhamento"}
        </button>

        {watch ? (
          <button
            type="button"
            onClick={() => void removeWatch({ ownerId, productId })}
            className="inline-flex items-center justify-center rounded-full bg-black/5 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-black/10"
          >
            Remover acompanhamento
          </button>
        ) : null}
      </div>
    </div>
  );
}
