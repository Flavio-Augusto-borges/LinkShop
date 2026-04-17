import Link from "next/link";

import { CatalogProductCard } from "@/features/catalog/components/catalog-product-card";
import type { CatalogItem } from "@/features/catalog/types/catalog.types";
import { SectionHeading } from "@/shared/ui/section-heading";

type CatalogHorizontalShelfProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: CatalogItem[];
  viewMoreHref: string;
};

export function CatalogHorizontalShelf({
  eyebrow,
  title,
  description,
  items,
  viewMoreHref
}: CatalogHorizontalShelfProps) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={
          <Link
            href={viewMoreHref}
            className="inline-flex items-center rounded-full bg-black/5 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-black/10"
          >
            Ver mais
          </Link>
        }
      />

      <div className="grid auto-cols-[78%] grid-flow-col gap-3 overflow-x-auto pb-2 sm:auto-cols-[48%] lg:auto-cols-[32%] xl:auto-cols-[24%]">
        {items.map((item) => (
          <CatalogProductCard key={item.product.id} item={item} variant="compact" />
        ))}
      </div>
    </section>
  );
}
