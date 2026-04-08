"use client";

import type { AdminHealthStatus } from "@/features/admin/types/admin.types";
import { Panel } from "@/shared/ui/panel";

type AdminHealthPanelProps = {
  title: string;
  description: string;
  status: AdminHealthStatus;
};

function getStatusLabel(status: AdminHealthStatus["status"]) {
  switch (status) {
    case "ok":
      return "Operacional";
    case "ready":
      return "Pronto";
    case "not_ready":
      return "Atenção";
    default:
      return "Indisponível";
  }
}

function getStatusTone(status: AdminHealthStatus["status"]) {
  switch (status) {
    case "ok":
    case "ready":
      return "bg-lagoon/10 text-lagoon";
    case "not_ready":
      return "bg-coral/10 text-coral";
    default:
      return "bg-black/5 text-neutral-600";
  }
}

export function AdminHealthPanel({ title, description, status }: AdminHealthPanelProps) {
  return (
    <Panel className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
        </div>
        <span className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${getStatusTone(status.status)}`}>
          {getStatusLabel(status.status)}
        </span>
      </div>

      {status.error ? <p className="text-sm text-coral">{status.error}</p> : null}

      {status.checks ? (
        <div className="grid gap-2 text-sm text-neutral-600">
          {Object.entries(status.checks).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-2xl bg-black/5 px-4 py-3">
              <span className="capitalize">{key}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {status.meta ? (
        <div className="grid gap-2 text-xs text-neutral-500">
          {Object.entries(status.meta).map(([key, value]) => (
            <span key={key}>
              {key}: <strong className="text-neutral-700">{String(value)}</strong>
            </span>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
