"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import type { CatalogItem } from "@/features/catalog/types/catalog.types";
import type { StoreId } from "@/features/product/types/store.types";
import { formatCurrency, getSafeImageUrl, normalizeText } from "@/shared/lib/format";
import { ConfirmationModal } from "@/shared/ui/confirmation-modal";

type AdminProductTableProps = {
  items: CatalogItem[];
  importedProductIds?: string[];
  initialSelectedProductIds?: string[];
  initialSelectionAction?: SelectionAction | null;
  onEditMany: (productIds: string[]) => void;
  onDeleteMany: (productIds: string[]) => Promise<void> | void;
};

type AdminTableSort = "recent" | "name" | "price";
type SelectionAction = "edit" | "delete";

function getStoreLabel(storeId: StoreId) {
  switch (storeId) {
    case "amazon":
      return "Amazon";
    case "mercado-livre":
      return "Mercado Livre";
    case "shopee":
      return "Shopee";
    default:
      return storeId;
  }
}

function getMostRecentSyncTimestamp(item: CatalogItem): number {
  return item.offers.reduce((latest, offer) => {
    const current = Date.parse(offer.lastSyncedAt);
    if (Number.isNaN(current)) {
      return latest;
    }
    return Math.max(latest, current);
  }, 0);
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
    </svg>
  );
}

function sanitizeProductIds(ids: string[]) {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

export function AdminProductTable({
  items,
  importedProductIds = [],
  initialSelectedProductIds = [],
  initialSelectionAction = null,
  onEditMany,
  onDeleteMany
}: AdminProductTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState<StoreId | "all">("all");
  const [sortBy, setSortBy] = useState<AdminTableSort>("recent");
  const [expandedDescriptionIds, setExpandedDescriptionIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => sanitizeProductIds(initialSelectedProductIds));
  const [selectionAction, setSelectionAction] = useState<SelectionAction | null>(() => {
    if (initialSelectionAction) {
      return initialSelectionAction;
    }
    return initialSelectedProductIds.length ? "edit" : null;
  });
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const importedSet = useMemo(() => new Set(importedProductIds), [importedProductIds]);
  const selectedSet = useMemo(() => new Set(selectedProductIds), [selectedProductIds]);
  const selectionMode = selectionAction !== null;
  const itemsById = useMemo(() => new Map(items.map((item) => [item.product.id, item])), [items]);

  const selectedItems = useMemo(
    () => selectedProductIds.map((productId) => itemsById.get(productId)).filter((item): item is CatalogItem => Boolean(item)),
    [itemsById, selectedProductIds]
  );

  useEffect(() => {
    if (!items.length) {
      return;
    }

    setSelectedProductIds((current) => current.filter((productId) => itemsById.has(productId)));
  }, [items.length, itemsById]);

  const availableStores = useMemo(() => {
    const storeSet = new Set<StoreId>();
    items.forEach((item) => {
      item.storeIds.forEach((storeId) => storeSet.add(storeId));
    });

    return [...storeSet].sort((first, second) => getStoreLabel(first).localeCompare(getStoreLabel(second), "pt-BR"));
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery.trim());

    const visible = items.filter((item) => {
      const matchesQuery = !normalizedQuery || normalizeText(item.product.name).includes(normalizedQuery);
      const matchesStore = storeFilter === "all" || item.storeIds.includes(storeFilter);
      return matchesQuery && matchesStore;
    });

    return visible.sort((first, second) => {
      if (sortBy === "name") {
        return first.product.name.localeCompare(second.product.name, "pt-BR");
      }

      if (sortBy === "price") {
        return first.lowestPrice - second.lowestPrice;
      }

      return getMostRecentSyncTimestamp(second) - getMostRecentSyncTimestamp(first);
    });
  }, [items, searchQuery, sortBy, storeFilter]);

  const visibleProductIds = useMemo(() => filteredItems.map((item) => item.product.id), [filteredItems]);
  const allVisibleSelected = useMemo(
    () => visibleProductIds.length > 0 && visibleProductIds.every((productId) => selectedSet.has(productId)),
    [selectedSet, visibleProductIds]
  );

  function toggleDescription(productId: string) {
    setExpandedDescriptionIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]
    );
  }

  function toggleProductSelection(productId: string) {
    setSelectedProductIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]
    );
  }

  function toggleSelectAllVisible(checked: boolean) {
    setSelectedProductIds((current) => {
      if (checked) {
        return [...new Set([...current, ...visibleProductIds])];
      }

      return current.filter((id) => !visibleProductIds.includes(id));
    });
  }

  function activateSelection(action: SelectionAction) {
    setSelectionAction((current) => (current === action ? null : action));
    setSelectedProductIds([]);
  }

  function cancelSelection() {
    setSelectionAction(null);
    setSelectedProductIds([]);
    setShowEditConfirmation(false);
    setShowDeleteConfirmation(false);
  }

  function handleCardSelectionToggle(productId: string) {
    if (!selectionMode) {
      return;
    }

    toggleProductSelection(productId);
  }

  function handleOpenEditConfirmation() {
    if (!selectedProductIds.length) {
      return;
    }

    setShowEditConfirmation(true);
  }

  function handleOpenDeleteConfirmation() {
    if (!selectedProductIds.length) {
      return;
    }

    setShowDeleteConfirmation(true);
  }

  function handleContinueEdit() {
    setShowEditConfirmation(false);
    onEditMany(selectedProductIds);
  }

  async function handleContinueDelete() {
    const selectedIdsSet = new Set(selectedProductIds);
    setShowDeleteConfirmation(false);
    await onDeleteMany(selectedProductIds);
    setSelectedProductIds((current) => current.filter((productId) => !selectedIdsSet.has(productId)));
    cancelSelection();
  }

  return (
    <div className="glass-panel p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">Itens cadastrados</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {filteredItems.length} de {items.length} itens visiveis no catalogo
          </p>
          {selectionMode ? (
            <p className="mt-1 text-sm text-neutral-500">
              Modo {selectionAction === "edit" ? "edicao" : "exclusao"} ativo. Selecionados: {selectedProductIds.length}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-label="Ativar selecao para editar"
            title="Selecionar para editar"
            onClick={() => activateSelection("edit")}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
              selectionAction === "edit"
                ? "border-lagoon/30 bg-lagoon/10 text-lagoon"
                : "border-black/10 bg-white text-neutral-700 hover:bg-black/5"
            }`}
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            aria-label="Ativar selecao para excluir"
            title="Selecionar para excluir"
            onClick={() => activateSelection("delete")}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
              selectionAction === "delete"
                ? "border-coral/30 bg-coral/10 text-coral"
                : "border-black/10 bg-white text-neutral-700 hover:bg-black/5"
            }`}
          >
            <TrashIcon />
          </button>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar por nome"
            className="min-w-[190px] rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none transition focus:border-coral/40"
          />
          <select
            value={storeFilter}
            onChange={(event) => setStoreFilter(event.target.value as StoreId | "all")}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none transition focus:border-coral/40"
          >
            <option value="all">Todas as lojas</option>
            {availableStores.map((storeId) => (
              <option key={storeId} value={storeId}>
                {getStoreLabel(storeId)}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as AdminTableSort)}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none transition focus:border-coral/40"
          >
            <option value="recent">Mais recentes</option>
            <option value="name">Nome</option>
            <option value="price">Preco</option>
          </select>
        </div>
      </div>

      {selectionMode ? (
        <div className="mb-4 flex flex-wrap gap-2 rounded-[1rem] border border-black/10 bg-black/5 p-3">
          <label className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(event) => toggleSelectAllVisible(event.target.checked)}
            />
            Selecionar todos
          </label>
          <button
            type="button"
            onClick={() => (selectionAction === "edit" ? handleOpenEditConfirmation() : handleOpenDeleteConfirmation())}
            disabled={!selectedProductIds.length}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
              selectionAction === "edit"
                ? "bg-lagoon/10 text-lagoon hover:bg-lagoon/20"
                : "bg-coral/10 text-coral hover:bg-coral/20"
            }`}
          >
            {selectionAction === "edit" ? "Confirmar edicao" : "Confirmar exclusao"}
          </button>
          <button
            type="button"
            onClick={cancelSelection}
            className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-black/5"
          >
            Cancelar selecao
          </button>
        </div>
      ) : null}

      <div className="grid gap-4">
        {filteredItems.length ? (
          filteredItems.map((item) => {
            const thumbnailUrl = getSafeImageUrl(item.product.thumbnailUrl);

            return (
              <article
                key={item.product.id}
                className={`rounded-[1.5rem] border bg-white p-5 ${
                  selectedSet.has(item.product.id) ? "border-coral/30" : "border-black/5"
                } ${selectionMode ? "cursor-pointer" : ""}`}
                onClick={() => handleCardSelectionToggle(item.product.id)}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-3 md:min-w-[200px]">
                    {selectionMode ? (
                      <input
                        type="checkbox"
                        checked={selectedSet.has(item.product.id)}
                        onChange={() => toggleProductSelection(item.product.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-1"
                      />
                    ) : null}
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-black/5">
                      {thumbnailUrl ? (
                        <Image src={thumbnailUrl} alt={item.product.name} fill sizes="80px" className="object-contain p-2" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-500">
                          Sem imagem
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 md:min-h-[190px] md:flex md:flex-col md:justify-between">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      {item.storeIds.map((storeId) => (
                        <span key={storeId} className="rounded-full bg-lagoon/10 px-3 py-1 text-lagoon">
                          {getStoreLabel(storeId)}
                        </span>
                      ))}
                      <span className="rounded-full bg-black/5 px-3 py-1 text-neutral-700">{item.product.category}</span>
                      {item.offers.some((offer) => offer.isFeatured) ? (
                        <span className="rounded-full bg-coral/10 px-3 py-1 text-coral">Destaque</span>
                      ) : null}
                      {importedSet.has(item.product.id) ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Importado na sessao</span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 max-w-3xl font-display text-2xl leading-tight">{item.product.name}</h3>

                    <div className="mt-2 max-w-3xl">
                      <p
                        className={`text-sm leading-7 text-neutral-600 ${
                          expandedDescriptionIds.includes(item.product.id) ? "" : "line-clamp-2"
                        }`}
                      >
                        {item.product.description}
                      </p>
                      {item.product.description.length > 140 ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleDescription(item.product.id);
                          }}
                          className="mt-1 text-xs font-semibold text-coral hover:underline"
                        >
                          {expandedDescriptionIds.includes(item.product.id) ? "Ver menos" : "Ver mais"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 md:min-w-[210px] md:justify-items-end">
                    <div className="rounded-[1.25rem] bg-orange-50 px-4 py-3 text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">Preco</p>
                      <strong className="value-safe font-display text-3xl text-ink">{formatCurrency(item.lowestPrice)}</strong>
                      {item.bestDiscountPercentage ? (
                        <p className="value-safe text-xs font-semibold text-lagoon">{item.bestDiscountPercentage}% OFF</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-black/5 p-6 text-sm text-neutral-600">
            Nenhum item encontrado com os filtros atuais.
          </div>
        )}
      </div>

      <ConfirmationModal
        open={showEditConfirmation}
        title="Confirmar fila de edicao"
        description="Revise os produtos selecionados. Ao continuar, voce sera direcionado para a fila de edicao no admin."
        confirmLabel="Continuar"
        cancelLabel="Cancelar"
        onConfirm={handleContinueEdit}
        onCancel={() => setShowEditConfirmation(false)}
      >
        <div className="max-h-[300px] space-y-2 overflow-y-auto">
          {selectedItems.map((item) => {
            const thumbnailUrl = getSafeImageUrl(item.product.thumbnailUrl);

            return (
              <div key={item.product.id} className="flex items-center gap-3 rounded-xl border border-black/5 bg-black/5 p-2">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-white">
                  {thumbnailUrl ? (
                    <Image src={thumbnailUrl} alt={item.product.name} fill sizes="48px" className="object-contain p-1" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-500">Sem imagem</div>
                  )}
                </div>
                <p className="line-clamp-2 text-sm font-medium text-ink">{item.product.name}</p>
              </div>
            );
          })}
        </div>
      </ConfirmationModal>

      <ConfirmationModal
        open={showDeleteConfirmation}
        title="Confirmar exclusao em massa"
        description={`A exclusao sera aplicada aos ${selectedProductIds.length} produtos selecionados. Essa acao nao pode ser desfeita.`}
        confirmLabel="Excluir selecionados"
        cancelLabel="Cancelar"
        confirmTone="danger"
        onConfirm={() => void handleContinueDelete()}
        onCancel={() => setShowDeleteConfirmation(false)}
      />
    </div>
  );
}
