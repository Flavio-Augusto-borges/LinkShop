"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminSectionNav } from "@/features/admin/components/admin-section-nav";
import { adminCatalogService } from "@/features/admin/services/admin-catalog.service";
import { adminProductsService } from "@/features/admin/services/admin-products.service";
import { useAdminImportReviewStore } from "@/features/admin/store/admin-import-review.store";
import type { AdminProductDraft } from "@/features/admin/types/admin.types";
import { useCatalogStore } from "@/stores";
import { formatPrice } from "@/shared/lib/format";
import { SectionHeading } from "@/shared/ui/section-heading";

export function AdminProductReviewView() {
  const drafts = useAdminImportReviewStore((state) => state.drafts);
  const updateDraft = useAdminImportReviewStore((state) => state.updateDraft);
  const removeDraft = useAdminImportReviewStore((state) => state.removeDraft);
  const clearDrafts = useAdminImportReviewStore((state) => state.clearDrafts);
  const upsertCatalogItem = useCatalogStore((state) => state.upsertCatalogItem);

  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const sortedDrafts = useMemo(
    () => [...drafts].sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt)),
    [drafts]
  );

  async function handlePublish(draftId: string, draft: AdminProductDraft) {
    setPublishingId(draftId);
    setFeedback(null);

    const item = adminCatalogService.buildCatalogItemFromDraft(draft);
    const response = await adminProductsService.createProduct(item, draft);

    if (!response.ok) {
      setFeedback({
        type: "error",
        message: response.error.message
      });
      setPublishingId(null);
      return;
    }

    upsertCatalogItem(response.data);
    removeDraft(draftId);
    setFeedback({
      type: "success",
      message: `Produto publicado: ${response.data.product.name}`
    });
    setPublishingId(null);
  }

  function updateDraftField(draftId: string, currentDraft: AdminProductDraft, patch: Partial<AdminProductDraft>) {
    updateDraft({
      draftId,
      draft: {
        ...currentDraft,
        ...patch
      }
    });
  }

  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Admin"
        title="Revisao antes da publicacao"
        description="Valide dados importados e publique manualmente. Nada entra no catalogo sem confirmacao."
      />
      <AdminSectionNav />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink">
          Pendentes: {sortedDrafts.length}
        </span>
        <Link
          href="/admin/produtos/importar"
          className="inline-flex items-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
        >
          Importar mais
        </Link>
        {sortedDrafts.length ? (
          <button
            type="button"
            onClick={() => clearDrafts()}
            className="inline-flex items-center rounded-full bg-black/5 px-5 py-3 text-sm font-semibold text-neutral-700"
          >
            Limpar pendentes
          </button>
        ) : null}
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

      {sortedDrafts.length ? (
        <div className="grid gap-4">
          {sortedDrafts.map((entry) => (
            <article key={entry.id} className="rounded-[1.5rem] bg-white p-5 shadow-glow">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
                <span>Fonte: {entry.sourceUrl}</span>
                <span>Provider: {entry.provider}</span>
                <span>Criado em: {new Date(entry.createdAt).toLocaleString("pt-BR")}</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-neutral-600">
                  Nome
                  <input
                    value={entry.draft.name}
                    onChange={(event) => updateDraftField(entry.id, entry.draft, { name: event.target.value })}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-coral/40"
                  />
                </label>
                <label className="grid gap-2 text-sm text-neutral-600">
                  Store
                  <select
                    value={entry.draft.storeId}
                    onChange={(event) =>
                      updateDraftField(entry.id, entry.draft, {
                        storeId: event.target.value as AdminProductDraft["storeId"]
                      })
                    }
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-coral/40"
                  >
                    <option value="amazon">Amazon</option>
                    <option value="mercado-livre">Mercado Livre</option>
                    <option value="shopee">Shopee</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-neutral-600 md:col-span-2">
                  URL da imagem
                  <input
                    value={entry.draft.thumbnailUrl}
                    onChange={(event) => updateDraftField(entry.id, entry.draft, { thumbnailUrl: event.target.value })}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-coral/40"
                  />
                </label>
                <label className="grid gap-2 text-sm text-neutral-600">
                  Preco
                  <input
                    type="number"
                    step="0.01"
                    value={entry.draft.price}
                    onChange={(event) => updateDraftField(entry.id, entry.draft, { price: event.target.value })}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-coral/40"
                  />
                </label>
                <label className="grid gap-2 text-sm text-neutral-600">
                  Link
                  <input
                    value={entry.draft.affiliateUrl}
                    onChange={(event) => updateDraftField(entry.id, entry.draft, { affiliateUrl: event.target.value })}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-coral/40"
                  />
                </label>
                <label className="grid gap-2 text-sm text-neutral-600 md:col-span-2">
                  Descricao
                  <textarea
                    rows={3}
                    value={entry.draft.description}
                    onChange={(event) => updateDraftField(entry.id, entry.draft, { description: event.target.value })}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-coral/40"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-neutral-500">Preco atual: {formatPrice(Number(entry.draft.price || 0))}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => removeDraft(entry.id)}
                    className="rounded-full bg-black/5 px-4 py-2 text-sm font-semibold text-neutral-700"
                  >
                    Remover
                  </button>
                  <button
                    type="button"
                    disabled={publishingId === entry.id}
                    onClick={() => void handlePublish(entry.id, entry.draft)}
                    className="rounded-full bg-coral px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {publishingId === entry.id ? "Publicando..." : "Publicar"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-black/10 bg-white px-6 py-10 text-sm text-neutral-600 shadow-glow">
          Nenhum rascunho pendente. Importe novos links em <Link href="/admin/produtos/importar" className="font-semibold text-coral">/admin/produtos/importar</Link>.
        </div>
      )}
    </section>
  );
}
