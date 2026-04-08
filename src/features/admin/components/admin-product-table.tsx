"use client";

import type { CatalogItem } from "@/features/catalog/types/catalog.types";
import { formatCurrency } from "@/shared/lib/format";

type AdminProductTableProps = {
  items: CatalogItem[];
  onEdit: (item: CatalogItem) => void;
  onDelete: (productId: string) => void;
};

function getStoreLabel(storeId: CatalogItem["storeIds"][number]) {
  switch (storeId) {
    case "amazon":
      return "Amazon";
    case "mercado-livre":
      return "Mercado Livre";
    case "shopee":
      return "Shopee";
    default:
      return storeId;
  }
}

export function AdminProductTable({ items, onEdit, onDelete }: AdminProductTableProps) {
  return (
    <div className="glass-panel p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">Itens cadastrados</h2>
          <p className="mt-1 text-sm text-neutral-500">{items.length} itens gerenciados no catálogo</p>
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <article key={item.product.id} className="rounded-[1.5rem] border border-black/5 bg-white p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  {item.storeIds.map((storeId) => (
                    <span key={storeId} className="rounded-full bg-lagoon/10 px-3 py-1 text-lagoon">
                      {getStoreLabel(storeId)}
                    </span>
                  ))}
                  <span className="rounded-full bg-black/5 px-3 py-1 text-neutral-700">{item.product.category}</span>
                  {item.offers.some((offer) => offer.isFeatured) ? (
                    <span className="rounded-full bg-coral/10 px-3 py-1 text-coral">Destaque</span>
                  ) : null}
                </div>
                <h3 className="mt-3 font-display text-2xl">{item.product.name}</h3>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-600">{item.product.description}</p>
                <p className="mt-3 text-sm text-neutral-500">
                  {formatCurrency(item.lowestPrice)}
                  {item.bestDiscountPercentage ? ` • ${item.bestDiscountPercentage}% OFF` : ""}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="rounded-full bg-lagoon/10 px-4 py-2 text-sm font-semibold text-lagoon"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.product.id)}
                  className="rounded-full bg-coral/10 px-4 py-2 text-sm font-semibold text-coral"
                >
                  Excluir
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
