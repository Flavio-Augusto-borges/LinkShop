import type { CatalogHomeSections } from "@/features/catalog/types/catalog.types";
import { CatalogSection } from "@/features/catalog/components/catalog-section";
import { CategoryList } from "@/features/catalog/components/category-list";
import { HomeSearchHero } from "@/features/catalog/components/home-search-hero";

type CatalogHomeViewProps = {
  sections: CatalogHomeSections;
};

export function CatalogHomeView({ sections }: CatalogHomeViewProps) {
  return (
    <>
      <HomeSearchHero />
      <CatalogSection
        eyebrow="Destaques"
        title="Produtos em destaque"
        description="Seleção com os itens mais fortes para descoberta e comparação rápida."
        items={sections.featuredProducts}
      />
      <CatalogSection
        eyebrow="Melhores ofertas"
        title="Descontos que merecem atenção"
        description="Produtos com os descontos mais relevantes entre os marketplaces disponíveis."
        items={sections.bestOffers}
      />
      <CategoryList categories={sections.categories} />
    </>
  );
}
