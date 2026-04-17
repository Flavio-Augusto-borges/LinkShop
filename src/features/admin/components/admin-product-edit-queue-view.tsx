"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AdminSectionNav } from "@/features/admin/components/admin-section-nav";
import { ProductForm } from "@/features/admin/components/product-form";
import { adminProductsService } from "@/features/admin/services/admin-products.service";
import type { AdminProductDraft } from "@/features/admin/types/admin.types";
import type { CatalogItem, CatalogSearchResult } from "@/features/catalog/types/catalog.types";
import { useCatalogStore } from "@/stores";
import { getSafeImageUrl, normalizeText } from "@/shared/lib/format";
import { SectionHeading } from "@/shared/ui/section-heading";

type AdminProductEditQueueViewProps = {
  initialCatalog: CatalogSearchResult;
  initialQueueIds: string[];
};

function sanitizeQueueIds(ids: string[]) {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

export function AdminProductEditQueueView({ initialCatalog, initialQueueIds }: AdminProductEditQueueViewProps) {
  const router = useRouter();

  const items = useCatalogStore((state) => state.items);
  const initialized = useCatalogStore((state) => state.initialized);
  const initializeCatalog = useCatalogStore((state) => state.initializeCatalog);
  const upsertCatalogItem = useCatalogStore((state) => state.upsertCatalogItem);

  const [queueIds, setQueueIds] = useState<string[]>(() => sanitizeQueueIds(initialQueueIds));
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState("");
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

  const itemsById = useMemo(() => new Map(items.map((item) => [item.product.id, item])), [items]);

  useEffect(() => {
    setQueueIds((current) => {
      const next = sanitizeQueueIds(current).filter((productId) => itemsById.has(productId));
      return next.length === current.length && next.every((id, index) => id === current[index]) ? current : next;
    });
  }, [itemsById]);

  useEffect(() => {
    if (!queueIds.length) {
      setSelectedProductId(null);
      return;
    }

    if (!selectedProductId || !queueIds.includes(selectedProductId)) {
      setSelectedProductId(queueIds[0]);
    }
  }, [queueIds, selectedProductId]);

  const queueItems = useMemo(
    () => queueIds.map((productId) => itemsById.get(productId)).filter((item): item is CatalogItem => Boolean(item)),
    [itemsById, queueIds]
  );

  const selectedItem = useMemo(
    () => queueItems.find((item) => item.product.id === selectedProductId) ?? null,
    [queueItems, selectedProductId]
  );

  const queueSet = useMemo(() => new Set(queueIds), [queueIds]);

  const addableItems = useMemo(() => {
    const query = normalizeText(addSearchQuery.trim());
    return items
      .filter((item) => !queueSet.has(item.product.id))
      .filter((item) => !query || normalizeText(item.product.name).includes(query))
      .slice(0, 20);
  }, [addSearchQuery, items, queueSet]);

  const selectedIndex = selectedItem ? queueItems.findIndex((item) => item.product.id === selectedItem.product.id) : -1;
  const hasPrevious = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < queueItems.length - 1;

  function handleAddToQueue(productId: string) {
    if (!productId || queueSet.has(productId)) {
      return;
    }

    setQueueIds((current) => [...current, productId]);
    if (!selectedProductId) {
      setSelectedProductId(productId);
    }
    setFeedback(null);
  }

  function handleRemoveFromQueue(productId: string) {
    setQueueIds((current) => current.filter((id) => id !== productId));
    if (selectedProductId === productId) {
      const nextCandidate = queueIds.find((id) => id !== productId) ?? null;
      setSelectedProductId(nextCandidate);
    }
  }

  async function handleSaveQueueItem(item: CatalogItem, draft: AdminProductDraft): Promise<{ ok: boolean; message: string }> {
    setFeedback(null);

    const response = await adminProductsService.updateProduct(item.product.id, item, draft);
    if (!response.ok) {
      const message = response.error.message;
      setFeedback({ type: "error", message });
      return { ok: false, message };
    }

    upsertCatalogItem(response.data);

    const nextQueue = queueIds.filter((id) => id !== item.product.id);
    setQueueIds(nextQueue);

    if (nextQueue.length === 0) {
      setFeedback({
        type: "success",
        message: "Edicoes salvas com sucesso. Retornando para a gestao de produtos."
      });
      router.push("/admin/produtos");
      return { ok: true, message: "Produto salvo com sucesso." };
    }

    const nextSelectedId =
      nextQueue[selectedIndex] ??
      nextQueue[selectedIndex - 1] ??
      nextQueue[0];
    setSelectedProductId(nextSelectedId);
    setFeedback({
      type: "success",
      message: `Produto salvo. Restam ${nextQueue.length} item(ns) na fila de edicao.`
    });
    return { ok: true, message: "Produto salvo com sucesso." };
  }

  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Admin"
        title="Fila de edicao de produtos"
        description="Revise e edite os produtos selecionados em sequencia antes de finalizar."
      />
      <AdminSectionNav />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/admin/produtos"
          className="inline-flex items-center rounded-full bg-black/5 px-5 py-3 text-sm font-semibold text-neutral-700"
        >
          Voltar para gestao
        </Link>
        <button
          type="button"
          onClick={() => setShowAddPanel((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink text-xl font-bold text-white hover:bg-neutral-800"
          aria-label="Adicionar mais produtos a fila"
          title="Adicionar mais produtos"
        >
          +
        </button>
        <span className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink">
          Na fila: {queueItems.length}
        </span>
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

      {showAddPanel ? (
        <div className="mb-6 rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-glow">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-display text-2xl">Adicionar produtos a fila</h3>
            <button
              type="button"
              onClick={() => setShowAddPanel(false)}
              className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-neutral-700"
            >
              Fechar
            </button>
          </div>

          <input
            type="search"
            value={addSearchQuery}
            onChange={(event) => setAddSearchQuery(event.target.value)}
            placeholder="Buscar produto para adicionar"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-coral/40"
          />

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {addableItems.length ? (
              addableItems.map((item) => (
                <button
                  key={item.product.id}
                  type="button"
                  onClick={() => handleAddToQueue(item.product.id)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/5 bg-black/5 px-3 py-2 text-left hover:border-black/10"
                >
                  <span className="line-clamp-2 text-sm font-medium text-ink">{item.product.name}</span>
                  <span className="rounded-full bg-ink px-2 py-1 text-xs font-semibold text-white">Adicionar</span>
                </button>
              ))
            ) : (
              <p className="text-sm text-neutral-500">Nenhum item disponivel para adicionar com esse filtro.</p>
            )}
          </div>
        </div>
      ) : null}

      {queueItems.length ? (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-[1.5rem] bg-white p-4 shadow-glow">
            <h3 className="font-display text-2xl">Produtos selecionados</h3>
            <p className="mt-1 text-sm text-neutral-500">A fila segue a ordem da selecao inicial.</p>

            <div className="mt-4 grid gap-2">
              {queueItems.map((item) => {
                const active = item.product.id === selectedProductId;
                const thumbnailUrl = getSafeImageUrl(item.product.thumbnailUrl);

                return (
                  <div
                    key={item.product.id}
                    className={`rounded-2xl border px-3 py-2 ${
                      active ? "border-coral bg-coral/5" : "border-black/5 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedProductId(item.product.id)}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-black/5">
                        {thumbnailUrl ? (
                          <Image src={thumbnailUrl} alt={item.product.name} fill sizes="48px" className="object-contain p-1" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-500">Sem imagem</div>
                        )}
                      </div>
                      <span className="line-clamp-2 text-sm font-semibold text-ink">{item.product.name}</span>
                    </button>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveFromQueue(item.product.id)}
                        className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-black/10"
                      >
                        Remover da fila
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {selectedItem ? (
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-black/10 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-neutral-700">
                    Editando item {selectedIndex + 1} de {queueItems.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!hasPrevious}
                      onClick={() => {
                        if (hasPrevious) {
                          setSelectedProductId(queueItems[selectedIndex - 1].product.id);
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
                          setSelectedProductId(queueItems[selectedIndex + 1].product.id);
                        }
                      }}
                      className="rounded-full bg-black/5 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-50"
                    >
                      Proximo
                    </button>
                  </div>
                </div>
              </div>

              <ProductForm
                item={selectedItem}
                onSave={handleSaveQueueItem}
                onCancel={() => router.push("/admin/produtos")}
                showImportSection={false}
                title="Editar produto da fila"
                description="Revise os dados e confirme o salvamento para avancar na fila."
                submitLabel={queueItems.length === 1 ? "Salvar e finalizar" : "Salvar e avancar"}
                saveConfirmation={{
                  title: "Confirmar salvamento",
                  description:
                    queueItems.length === 1
                      ? "Deseja salvar esta edicao e finalizar a fila?"
                      : "Deseja salvar esta edicao e seguir para o proximo item da fila?",
                  confirmLabel: "Salvar",
                  cancelLabel: "Cancelar"
                }}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-black/10 bg-white px-6 py-10 text-sm text-neutral-600 shadow-glow">
          Nenhum produto na fila de edicao. Retorne para{" "}
          <Link href="/admin/produtos" className="font-semibold text-coral">
            /admin/produtos
          </Link>{" "}
          e selecione produtos para editar.
        </div>
      )}
    </section>
  );
}
