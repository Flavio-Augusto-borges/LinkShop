"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminProductTable } from "@/features/admin/components/admin-product-table";
import { AdminSectionNav } from "@/features/admin/components/admin-section-nav";
import { adminProductsService } from "@/features/admin/services/admin-products.service";
import type { CatalogSearchResult } from "@/features/catalog/types/catalog.types";
import { useCatalogStore } from "@/stores";
import { SectionHeading } from "@/shared/ui/section-heading";

type AdminProductsManageViewProps = {
  initialCatalog: CatalogSearchResult;
};

export function AdminProductsManageView({ initialCatalog }: AdminProductsManageViewProps) {
  const router = useRouter();
  const items = useCatalogStore((state) => state.items);
  const initialized = useCatalogStore((state) => state.initialized);
  const initializeCatalog = useCatalogStore((state) => state.initializeCatalog);
  const removeCatalogItem = useCatalogStore((state) => state.removeCatalogItem);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!initialized) {
      initializeCatalog({
        items: initialCatalog.items,
        availableCategories: initialCatalog.availableCategories,
        total: initialCatalog.total
      });
    }
  }, [initialCatalog, initializeCatalog, initialized]);

  function handleEditManyCatalogItems(productIds: string[]) {
    const uniqueProductIds = [...new Set(productIds)];
    if (!uniqueProductIds.length) {
      return;
    }

    const params = new URLSearchParams({
      ids: uniqueProductIds.join(",")
    });
    router.push(`/admin/produtos/editar?${params.toString()}`);
  }

  async function handleDeleteManyCatalogItems(productIds: string[]) {
    const uniqueProductIds = [...new Set(productIds)];
    if (!uniqueProductIds.length) {
      return;
    }

    setFeedback(null);
    let removedCount = 0;
    let failedCount = 0;
    let firstErrorMessage: string | null = null;

    for (const productId of uniqueProductIds) {
      const response = await adminProductsService.deleteProduct(productId);
      if (!response.ok) {
        failedCount += 1;
        if (!firstErrorMessage) {
          firstErrorMessage = response.error.message;
        }
        continue;
      }

      removeCatalogItem(productId);
      removedCount += 1;
    }

    if (removedCount > 0 && failedCount === 0) {
      setFeedback({
        type: "success",
        message:
          removedCount === 1
            ? "1 produto removido com sucesso."
            : `${removedCount} produtos removidos com sucesso.`
      });
      return;
    }

    if (removedCount > 0 && failedCount > 0) {
      setFeedback({
        type: "error",
        message: `${removedCount} removidos e ${failedCount} falharam. ${firstErrorMessage ?? ""}`.trim()
      });
      return;
    }

    setFeedback({
      type: "error",
      message: firstErrorMessage ?? "Nao foi possivel remover os produtos selecionados."
    });
  }

  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Admin"
        title="Gestao de catalogo"
        description="Gerencie itens publicados, edite dados de produto e mantenha o catalogo organizado."
      />
      <AdminSectionNav />

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/admin/produtos/importar"
          className="inline-flex items-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
        >
          Importar para revisao
        </Link>
        <Link
          href="/admin/produtos/revisar"
          className="inline-flex items-center rounded-full bg-black/5 px-5 py-3 text-sm font-semibold text-neutral-700"
        >
          Revisar pendentes
        </Link>
      </div>

      {feedback ? (
        <div
          className={`mb-6 rounded-[1.5rem] px-5 py-4 text-sm ${
            feedback.type === "success"
              ? "border border-lagoon/20 bg-lagoon/10 text-lagoon"
              : "border border-coral/20 bg-coral/10 text-coral"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <AdminProductTable
        items={items}
        onEditMany={handleEditManyCatalogItems}
        onDeleteMany={handleDeleteManyCatalogItems}
      />
    </section>
  );
}
