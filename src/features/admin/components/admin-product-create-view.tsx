"use client";

import Link from "next/link";
import { useState } from "react";

import { AdminSectionNav } from "@/features/admin/components/admin-section-nav";
import { ProductForm } from "@/features/admin/components/product-form";
import { adminProductsService } from "@/features/admin/services/admin-products.service";
import type { AdminProductDraft } from "@/features/admin/types/admin.types";
import type { CatalogItem } from "@/features/catalog/types/catalog.types";
import { SectionHeading } from "@/shared/ui/section-heading";

export function AdminProductCreateView() {
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleCreate(item: CatalogItem, draft: AdminProductDraft): Promise<{ ok: boolean; message: string }> {
    setFeedback(null);
    const response = await adminProductsService.createProduct(item, draft);

    if (!response.ok) {
      const message = response.error.message;
      setFeedback({ type: "error", message });
      return { ok: false, message };
    }

    const message = "Produto publicado com sucesso.";
    setFeedback({ type: "success", message });
    return { ok: true, message };
  }

  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Admin"
        title="Cadastro manual de produto"
        description="Publique um produto manualmente quando voce ja tiver os dados validados."
      />
      <AdminSectionNav />

      <div className="mb-6">
        <Link
          href="/admin/produtos"
          className="inline-flex items-center rounded-full bg-black/5 px-5 py-3 text-sm font-semibold text-neutral-700"
        >
          Voltar para gestao de produtos
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

      <ProductForm
        item={null}
        onSave={handleCreate}
        onCancel={() => {
          setFeedback(null);
        }}
        showImportSection={false}
        title="Novo produto manual"
        description="Preencha os dados e publique somente quando o item estiver pronto para o catalogo publico."
        submitLabel="Publicar produto"
      />
    </section>
  );
}
