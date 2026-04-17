"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AdminSectionNav } from "@/features/admin/components/admin-section-nav";
import { adminCatalogService } from "@/features/admin/services/admin-catalog.service";
import { adminProductsService } from "@/features/admin/services/admin-products.service";
import { useAdminImportReviewStore } from "@/features/admin/store/admin-import-review.store";
import type { AdminProductDraft } from "@/features/admin/types/admin.types";
import { useCatalogStore } from "@/stores";
import { formatPrice, getSafeImageUrl, isFinitePositiveNumber } from "@/shared/lib/format";
import { getStoreDisplayName } from "@/shared/lib/store";
import { SectionHeading } from "@/shared/ui/section-heading";

function isDraftReadyToPublish(draft: AdminProductDraft) {
  return Boolean(
    draft.name.trim() &&
      draft.description.trim() &&
      draft.affiliateUrl.trim() &&
      draft.thumbnailUrl.trim() &&
      isFinitePositiveNumber(Number(draft.price))
  );
}

export function AdminProductReviewView() {
  const drafts = useAdminImportReviewStore((state) => state.drafts);
  const updateDraft = useAdminImportReviewStore((state) => state.updateDraft);
  const removeDraft = useAdminImportReviewStore((state) => state.removeDraft);
  const clearDrafts = useAdminImportReviewStore((state) => state.clearDrafts);
  const upsertCatalogItem = useCatalogStore((state) => state.upsertCatalogItem);

  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const sortedDrafts = useMemo(
    () => [...drafts].sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt)),
    [drafts]
  );

  useEffect(() => {
    if (!sortedDrafts.length) {
      setSelectedDraftId(null);
      return;
    }

    const stillExists = selectedDraftId
      ? sortedDrafts.some((entry) => entry.id === selectedDraftId)
      : false;

    if (!stillExists) {
      setSelectedDraftId(sortedDrafts[0].id);
    }
  }, [selectedDraftId, sortedDrafts]);

  const selectedIndex = useMemo(
    () => sortedDrafts.findIndex((entry) => entry.id === selectedDraftId),
    [selectedDraftId, sortedDrafts]
  );
  const selectedEntry = selectedIndex >= 0 ? sortedDrafts[selectedIndex] : null;

  const selectedDraft = selectedEntry?.draft ?? null;
  const selectedImageUrl = getSafeImageUrl(selectedDraft?.thumbnailUrl);
  const hasPrevious = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < sortedDrafts.length - 1;

  async function handlePublish(draftId: string, draft: AdminProductDraft) {
    const currentIndex = sortedDrafts.findIndex((entry) => entry.id === draftId);
    const nextCandidate =
      sortedDrafts[currentIndex + 1]?.id ?? sortedDrafts[currentIndex - 1]?.id ?? null;

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
    setSelectedDraftId(nextCandidate);
    setFeedback({
      type: "success",
      message: `Produto publicado: ${response.data.product.name}`
    });
    setPublishingId(null);
  }

  function handleRemoveDraft(draftId: string) {
    const currentIndex = sortedDrafts.findIndex((entry) => entry.id === draftId);
    const nextCandidate =
      sortedDrafts[currentIndex + 1]?.id ?? sortedDrafts[currentIndex - 1]?.id ?? null;
    removeDraft(draftId);
    setSelectedDraftId(nextCandidate);
    setFeedback({
      type: "success",
      message: "Rascunho descartado com sucesso."
    });
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
            onClick={() => {
              clearDrafts();
              setSelectedDraftId(null);
              setFeedback({
                type: "success",
                message: "Fila de revisao limpa."
              });
            }}
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
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-[1.5rem] bg-white p-4 shadow-glow">
            <h3 className="font-display text-2xl">Fila de revisao</h3>
            <p className="mt-1 text-sm text-neutral-500">Selecione um rascunho para revisar e publicar.</p>

            <div className="mt-4 grid gap-2">
              {sortedDrafts.map((entry) => {
                const active = entry.id === selectedDraftId;
                const ready = isDraftReadyToPublish(entry.draft);

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedDraftId(entry.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-coral bg-coral/5"
                        : "border-black/5 bg-white hover:border-black/15"
                    }`}
                  >
                    <p className="line-clamp-2 text-sm font-semibold text-ink">
                      {entry.draft.name.trim() || "Sem nome"}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {getStoreDisplayName(entry.draft.storeId)} • {formatPrice(Number(entry.draft.price || 0))}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {new Date(entry.createdAt).toLocaleString("pt-BR")}
                    </p>
                    <p className={`mt-2 text-xs font-semibold ${ready ? "text-lagoon" : "text-amber-700"}`}>
                      {ready ? "Pronto para publicar" : "Revisar campos obrigatorios"}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          {selectedEntry && selectedDraft ? (
            <article className="rounded-[1.5rem] bg-white p-5 shadow-glow">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-3xl">Rascunho selecionado</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Item {selectedIndex + 1} de {sortedDrafts.length}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!hasPrevious}
                    onClick={() => {
                      if (hasPrevious) {
                        setSelectedDraftId(sortedDrafts[selectedIndex - 1].id);
                      }
                    }}
                    className="rounded-full bg-black/5 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={!hasNext}
                    onClick={() => {
                      if (hasNext) {
                        setSelectedDraftId(sortedDrafts[selectedIndex + 1].id);
                      }
                    }}
                    className="rounded-full bg-black/5 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-50"
                  >
                    Proximo
                  </button>
                </div>
              </div>

              <div className="mb-5 grid gap-4 rounded-[1.25rem] border border-black/5 bg-black/5 p-4 md:grid-cols-[160px_minmax(0,1fr)]">
                <div className="relative h-40 overflow-hidden rounded-xl bg-white">
                  {selectedImageUrl ? (
                    <Image
                      src={selectedImageUrl}
                      alt={selectedDraft.name || "Imagem do rascunho"}
                      fill
                      sizes="160px"
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                      Sem imagem valida
                    </div>
                  )}
                </div>

                <div className="grid gap-2 text-sm text-neutral-600">
                  <p>
                    <strong className="text-ink">Nome:</strong> {selectedDraft.name || "Sem nome"}
                  </p>
                  <p>
                    <strong className="text-ink">Preco:</strong> {formatPrice(Number(selectedDraft.price || 0))}
                  </p>
                  <p>
                    <strong className="text-ink">Store:</strong> {getStoreDisplayName(selectedDraft.storeId)}
                  </p>
                  <p className="line-clamp-2">
                    <strong className="text-ink">Descricao:</strong>{" "}
                    {selectedDraft.description || "Sem descricao"}
                  </p>
                  <p className="line-clamp-1">
                    <strong className="text-ink">Link:</strong>{" "}
                    {selectedDraft.affiliateUrl || "Sem link"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-neutral-600">
                  Nome
                  <input
                    value={selectedDraft.name}
                    onChange={(event) =>
                      updateDraftField(selectedEntry.id, selectedDraft, { name: event.target.value })
                    }
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-coral/40"
                  />
                </label>
                <label className="grid gap-2 text-sm text-neutral-600">
                  Store
                  <select
                    value={selectedDraft.storeId}
                    onChange={(event) =>
                      updateDraftField(selectedEntry.id, selectedDraft, {
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
                    value={selectedDraft.thumbnailUrl}
                    onChange={(event) =>
                      updateDraftField(selectedEntry.id, selectedDraft, { thumbnailUrl: event.target.value })
                    }
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-coral/40"
                  />
                </label>
                <label className="grid gap-2 text-sm text-neutral-600">
                  Preco
                  <input
                    type="number"
                    step="0.01"
                    value={selectedDraft.price}
                    onChange={(event) =>
                      updateDraftField(selectedEntry.id, selectedDraft, { price: event.target.value })
                    }
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-coral/40"
                  />
                </label>
                <label className="grid gap-2 text-sm text-neutral-600">
                  Link
                  <input
                    value={selectedDraft.affiliateUrl}
                    onChange={(event) =>
                      updateDraftField(selectedEntry.id, selectedDraft, { affiliateUrl: event.target.value })
                    }
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-coral/40"
                  />
                </label>
                <label className="grid gap-2 text-sm text-neutral-600 md:col-span-2">
                  Descricao
                  <textarea
                    rows={4}
                    value={selectedDraft.description}
                    onChange={(event) =>
                      updateDraftField(selectedEntry.id, selectedDraft, { description: event.target.value })
                    }
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-coral/40"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-neutral-500">
                  Fonte: {selectedEntry.sourceUrl} • Resolvida: {selectedEntry.resolvedUrl ?? "-"}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveDraft(selectedEntry.id)}
                    className="rounded-full bg-black/5 px-4 py-2 text-sm font-semibold text-neutral-700"
                  >
                    Descartar rascunho
                  </button>
                  <button
                    type="button"
                    disabled={publishingId === selectedEntry.id || !isDraftReadyToPublish(selectedDraft)}
                    onClick={() => void handlePublish(selectedEntry.id, selectedDraft)}
                    className="rounded-full bg-coral px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {publishingId === selectedEntry.id ? "Publicando..." : "Publicar produto"}
                  </button>
                </div>
              </div>
            </article>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-black/10 bg-white px-6 py-10 text-sm text-neutral-600 shadow-glow">
          Nenhum rascunho pendente. Importe novos links em{" "}
          <Link href="/admin/produtos/importar" className="font-semibold text-coral">
            /admin/produtos/importar
          </Link>
          .
        </div>
      )}
    </section>
  );
}
