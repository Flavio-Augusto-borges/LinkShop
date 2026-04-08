import type { CatalogItem } from "@/features/catalog/types/catalog.types";
import { CatalogGrid } from "@/features/catalog/components/catalog-grid";
import { SectionHeading } from "@/shared/ui/section-heading";

type CatalogSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: CatalogItem[];
};

export function CatalogSection({ eyebrow, title, description, items }: CatalogSectionProps) {
  return (
    <section className="section-shell">
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <CatalogGrid items={items} />
    </section>
  );
}
