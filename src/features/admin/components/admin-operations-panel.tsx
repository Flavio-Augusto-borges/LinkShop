"use client";

import type { AdminOperationalSummary } from "@/features/admin/types/admin.types";
import { Panel } from "@/shared/ui/panel";

type AdminOperationsPanelProps = {
  summary: AdminOperationalSummary | null;
};

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("pt-BR");
}

export function AdminOperationsPanel({ summary }: AdminOperationsPanelProps) {
  if (!summary) {
    return (
      <Panel className="space-y-3">
        <h3 className="font-display text-2xl text-ink">Operacao runtime</h3>
        <p className="text-sm text-neutral-500">Resumo operacional indisponivel neste ambiente.</p>
      </Panel>
    );
  }

  const topFlows = summary.flows
    .slice()
    .sort((first, second) => (second.metrics.requests ?? 0) - (first.metrics.requests ?? 0))
    .slice(0, 4);

  return (
    <Panel className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl text-ink">Operacao runtime</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Visao resumida de volume, falhas e ultimo contexto de erro para diagnostico pos-deploy.
          </p>
        </div>
        <span className="rounded-full bg-black/5 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-neutral-600">
          uptime {summary.uptimeSeconds}s
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-black/5 px-4 py-3 text-sm text-neutral-600">
          Requests totais <strong className="block text-lg text-ink">{summary.requests.total}</strong>
        </div>
        <div className="rounded-2xl bg-black/5 px-4 py-3 text-sm text-neutral-600">
          Requests API <strong className="block text-lg text-ink">{summary.requests.api}</strong>
        </div>
        <div className="rounded-2xl bg-coral/5 px-4 py-3 text-sm text-neutral-600">
          Falhas HTTP <strong className="block text-lg text-ink">{summary.requests.failed}</strong>
        </div>
        <div className="rounded-2xl bg-coral/10 px-4 py-3 text-sm text-neutral-600">
          Erros 5xx <strong className="block text-lg text-ink">{summary.requests.serverError}</strong>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">Fluxos criticos</h4>
          {topFlows.length === 0 ? (
            <p className="text-sm text-neutral-500">Sem dados de fluxo no runtime atual.</p>
          ) : (
            topFlows.map((flow) => (
              <div key={flow.name} className="rounded-2xl border border-black/10 px-4 py-3 text-sm text-neutral-600">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-ink">{flow.name}</strong>
                  <span>
                    req {flow.metrics.requests ?? 0} | ok {flow.metrics.successes ?? 0} | fail{" "}
                    {flow.metrics.failures ?? 0}
                  </span>
                </div>
                {flow.lastError ? (
                  <p className="mt-2 text-xs text-coral">
                    Ultimo erro: {flow.lastError.message} ({formatDate(flow.lastError.occurredAt)})
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">Persistencia recente</h4>
          <div className="rounded-2xl border border-black/10 px-4 py-3 text-sm text-neutral-600">
            <p>Sync runs: {summary.persistent.totalSyncRuns}</p>
            <p>Clicks: {summary.persistent.totalClickEvents}</p>
            <p>Alert events: {summary.persistent.totalAlertEvents}</p>
            <p>Ultimo sync: {summary.persistent.latestSyncRunStatus ?? "-"} ({formatDate(summary.persistent.latestSyncRunAt)})</p>
            <p>Ultimo click: {formatDate(summary.persistent.latestClickAt)}</p>
            <p>Ultimo alerta: {formatDate(summary.persistent.latestAlertAt)}</p>
          </div>

          {summary.lastError ? (
            <div className="rounded-2xl border border-coral/30 bg-coral/5 px-4 py-3 text-xs text-coral">
              <p className="font-semibold uppercase tracking-[0.14em]">Ultimo erro global</p>
              <p className="mt-1">{summary.lastError.message}</p>
              <p className="mt-1">
                flow: {summary.lastError.flow ?? "-"} | request: {summary.lastError.requestId ?? "-"} |{" "}
                {formatDate(summary.lastError.occurredAt)}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
