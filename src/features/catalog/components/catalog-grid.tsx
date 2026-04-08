import type { ReactNode } from "react";

import type { CatalogItem } from "@/features/catalog/types/catalog.types";
import { CatalogProductCard } from "@/features/catalog/components/catalog-product-card";

type CatalogGridProps = {
  items: CatalogItem[];
  emptyState?: ReactNode;
};

export function CatalogGrid({ items, emptyState }: CatalogGridProps) {
  if (!items.length) {
    return <>{emptyState ?? null}</>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {items.map((item) => (
        <CatalogProductCard key={item.product.id} item={item} />
      ))}
    </div>
  );
}
