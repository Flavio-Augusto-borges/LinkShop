import Link from "next/link";

import type { CatalogCategorySummary } from "@/features/catalog/types/catalog.types";
import { formatCurrency } from "@/shared/lib/format";
import { SectionHeading } from "@/shared/ui/section-heading";

type CategoryListProps = {
  categories: CatalogCategorySummary[];
};

export function CategoryList({ categories }: CategoryListProps) {
  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Categorias"
        title="Explore por categoria"
        description="Atalhos rápidos para os grupos de produto mais fortes do catálogo."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/buscar?categoria=${encodeURIComponent(category.name)}`}
            className="rounded-[1.5rem] border border-black/5 bg-white p-5 transition hover:-translate-y-1 hover:shadow-glow"
          >
            <h3 className="font-display text-2xl">{category.name}</h3>
            <p className="mt-3 text-sm text-neutral-600">{category.productCount} produtos comparáveis</p>
            <p className="mt-2 text-sm text-neutral-500">A partir de {formatCurrency(category.lowestPrice)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
