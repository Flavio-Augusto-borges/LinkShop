"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ProductCarouselSection } from "@/features/catalog/components/catalog-horizontal-shelf";
import { catalogService } from "@/features/catalog/services/catalog.service";
import type { CatalogHomeSections } from "@/features/catalog/types/catalog.types";
import type { CatalogItem } from "@/features/catalog/types/catalog.types";
import { useAuthStore, useRecentViewsStore } from "@/stores";
import { SectionHeading } from "@/shared/ui/section-heading";

type CatalogHomeViewProps = {
  sections: CatalogHomeSections;
};

export function CatalogHomeView({ sections }: CatalogHomeViewProps) {
  const session = useAuthStore((state) => state.session);
  const recentViews = useRecentViewsStore((state) => state.recentViews);
  const ownerId = session?.user.id ?? null;
  const recentProductIds = useMemo(
    () =>
      recentViews
        .filter((entry) => entry.ownerId === ownerId)
        .sort((left, right) => new Date(right.viewedAt).getTime() - new Date(left.viewedAt).getTime())
        .map((entry) => entry.productId),
    [ownerId, recentViews]
  );
  const [recentItems, setRecentItems] = useState<CatalogItem[]>([]);

  useEffect(() => {
    let active = true;

    async function loadRecentItems() {
      if (!ownerId || !recentProductIds.length) {
        if (active) {
          setRecentItems([]);
        }
        return;
      }

      const response = await catalogService.getCatalogItemsByProductIds(recentProductIds);

      if (active) {
        const itemsByProductId = new Map((response.ok ? response.data : []).map((item) => [item.product.id, item] as const));
        setRecentItems(
          recentProductIds
            .map((productId) => itemsByProductId.get(productId) ?? null)
            .filter(Boolean)
            .slice(0, 12) as CatalogItem[]
        );
      }
    }

    void loadRecentItems();

    return () => {
      active = false;
    };
  }, [ownerId, recentProductIds]);

  return (
    <>
      <section className="section-shell">
        <SectionHeading
          eyebrow="Vitrine"
          title="Descubra ofertas por contexto"
          description="Navegue por vitrines horizontais e abra a listagem completa da secao quando quiser."
          action={
            <Link
              href="/buscar"
              className="inline-flex items-center rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Ver todos os produtos
            </Link>
          }
        />
      </section>

      {recentItems.length ? (
        <ProductCarouselSection
          contextKey="continue-browsing"
          title="Continue de onde parou"
          description="Retome rapidamente os produtos que voce abriu recentemente e continue a comparacao."
          items={recentItems}
          viewMoreHref="/conta"
        />
      ) : null}

      {sections.shelves.map((shelf) => (
        <ProductCarouselSection
          key={shelf.id}
          contextKey={shelf.contextKey}
          title={shelf.title}
          description={shelf.description}
          items={shelf.items}
          viewMoreHref={shelf.viewMoreHref}
        />
      ))}
    </>
  );
}
