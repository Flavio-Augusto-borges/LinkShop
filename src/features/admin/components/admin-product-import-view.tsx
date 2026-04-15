"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminSectionNav } from "@/features/admin/components/admin-section-nav";
import { adminProductsService } from "@/features/admin/services/admin-products.service";
import { useAdminImportReviewStore } from "@/features/admin/store/admin-import-review.store";
import type { AdminReviewBatchImportResult } from "@/features/admin/types/admin.types";
import { SectionHeading } from "@/shared/ui/section-heading";

export function AdminProductImportView() {
  const drafts = useAdminImportReviewStore((state) => state.drafts);
  const addDraftFromImport = useAdminImportReviewStore((state) => state.addDraftFromImport);

  const [singleUrl, setSingleUrl] = useState("");
  const [batchInput, setBatchInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AdminReviewBatchImportResult | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const pendingCount = drafts.length;

  const recentDrafts = useMemo(() => drafts.slice(0, 5), [drafts]);

  async function handleImport(urls: string[]) {
    const normalized = urls.map((entry) => entry.trim()).filter(Boolean);
    if (!normalized.length) {
      setFeedback({ type: "error", message: "Informe pelo menos uma URL valida para importacao." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    setResult(null);

    const response = await adminProductsService.importProductsToReview(normalized);
    response.results.forEach((entry) => {
      if (entry.status === "pending_review" && entry.imported) {
        addDraftFromImport({
          sourceUrl: entry.url,
          imported: entry.imported
        });
      }
    });

    setResult(response);
    setFeedback({
      type: "success",
      message: `${response.summary.pendingReview} item(ns) adicionados para revisao manual.`
    });
    setIsSubmitting(false);
  }

  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Admin"
        title="Importar produtos para revisao"
        description="A importacao nao publica automaticamente. Cada item entra em rascunho para validacao manual."
      />
      <AdminSectionNav />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink">
          Pendentes de revisao: {pendingCount}
        </span>
        <Link
          href="/admin/produtos/revisar"
          className="inline-flex items-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white"
        >
          Ir para revisao
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-glow">
          <h3 className="font-display text-2xl">Importar por link unico</h3>
          <p className="mt-2 text-sm text-neutral-600">Cole um link direto ou afiliado para gerar um rascunho de revisao.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={singleUrl}
              onChange={(event) => setSingleUrl(event.target.value)}
              type="url"
              placeholder="https://meli.la/..."
              className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-coral/40"
            />
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleImport([singleUrl])}
              className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {isSubmitting ? "Importando..." : "Importar"}
            </button>
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-white p-5 shadow-glow">
          <h3 className="font-display text-2xl">Importacao em lote</h3>
          <p className="mt-2 text-sm text-neutral-600">Uma URL por linha. Itens validos entram em revisao pendente.</p>
          <textarea
            value={batchInput}
            onChange={(event) => setBatchInput(event.target.value)}
            rows={6}
            placeholder={"https://produto.mercadolivre.com.br/...\nhttps://meli.la/..."}
            className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-coral/40"
          />
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleImport(batchInput.split(/\r?\n/))}
            className="mt-3 inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {isSubmitting ? "Importando..." : "Importar lote para revisao"}
          </button>
        </div>
      </div>

      {result ? (
        <div className="mt-6 rounded-[1.5rem] bg-white p-5 shadow-glow">
          <p className="text-sm font-semibold text-ink">
            Resumo: {result.summary.pendingReview} em revisao | {result.summary.invalid} invalidos |{" "}
            {result.summary.extractionFailed} falha de extracao | {result.summary.notSupported} nao suportados
          </p>
          <div className="mt-3 max-h-56 overflow-auto rounded-xl bg-black/5">
            <table className="w-full text-left text-xs text-neutral-600">
              <thead className="sticky top-0 bg-white">
                <tr>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">URL enviada</th>
                  <th className="px-3 py-2">URL resolvida</th>
                  <th className="px-3 py-2">Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((entry, index) => (
                  <tr key={`${entry.url}-${index}`} className="border-t border-black/5">
                    <td className="px-3 py-2">{entry.status}</td>
                    <td className="max-w-[260px] truncate px-3 py-2">{entry.url}</td>
                    <td className="max-w-[260px] truncate px-3 py-2">{entry.resolvedUrl ?? "-"}</td>
                    <td className="px-3 py-2">{entry.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {recentDrafts.length ? (
        <div className="mt-6 rounded-[1.5rem] bg-white p-5 shadow-glow">
          <h3 className="font-display text-2xl">Rascunhos recentes</h3>
          <div className="mt-3 grid gap-2 text-sm text-neutral-600">
            {recentDrafts.map((entry) => (
              <span key={entry.id}>
                {entry.draft.name || "Sem nome"} • {entry.provider} • {new Date(entry.createdAt).toLocaleString("pt-BR")}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
