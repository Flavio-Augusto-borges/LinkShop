"use client";

import { useMemo, useState } from "react";

import { CatalogSection } from "@/features/catalog/components/catalog-section";
import { CategoryList } from "@/features/catalog/components/category-list";
import { HomeSearchHero } from "@/features/catalog/components/home-search-hero";
import type { CatalogHomeSections } from "@/features/catalog/types/catalog.types";

type CatalogHomeViewProps = {
  sections: CatalogHomeSections;
};

type HomeSectionKey = "featured" | "best-offers" | "categories";

export function CatalogHomeView({ sections }: CatalogHomeViewProps) {
  const [activeSection, setActiveSection] = useState<HomeSectionKey>("featured");

  const sectionTabs = useMemo(
    () => [
      {
        key: "featured" as const,
        label: "Destaques",
        description: "Produtos mais fortes para descoberta rapida."
      },
      {
        key: "best-offers" as const,
        label: "Melhores ofertas",
        description: "Descontos com maior potencial de economia."
      },
      {
        key: "categories" as const,
        label: "Categorias",
        description: "Atalhos para navegar por segmentos do catalogo."
      }
    ],
    []
  );

  const currentSection = sectionTabs.find((entry) => entry.key === activeSection) ?? sectionTabs[0];

  return (
    <>
      <HomeSearchHero />

      <section className="section-shell">
        <div className="rounded-[1.5rem] bg-white p-4 shadow-glow">
          <div className="flex flex-wrap items-center gap-2">
            {sectionTabs.map((tab) => {
              const isActive = tab.key === activeSection;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveSection(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-coral text-white" : "bg-black/5 text-neutral-700 hover:bg-black/10"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-sm text-neutral-600">{currentSection.description}</p>
        </div>
      </section>

      {activeSection === "featured" ? (
        <CatalogSection
          eyebrow="Destaques"
          title="Produtos em destaque"
          description="Selecao com os itens mais fortes para descoberta e comparacao rapida."
          items={sections.featuredProducts}
        />
      ) : null}

      {activeSection === "best-offers" ? (
        <CatalogSection
          eyebrow="Melhores ofertas"
          title="Descontos que merecem atencao"
          description="Produtos com descontos mais relevantes entre os marketplaces disponiveis."
          items={sections.bestOffers}
        />
      ) : null}

      {activeSection === "categories" ? <CategoryList categories={sections.categories} /> : null}
    </>
  );
}
