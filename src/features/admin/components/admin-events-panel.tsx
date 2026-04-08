"use client";

import type { AdminAlertEvent, AdminClickEvent } from "@/features/admin/types/admin.types";
import { formatCurrency } from "@/shared/lib/format";
import { Panel } from "@/shared/ui/panel";

type AdminEventsPanelProps = {
  title: string;
  description: string;
  items: Array<AdminClickEvent | AdminAlertEvent>;
  type: "clicks" | "alerts";
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

export function AdminEventsPanel({ title, description, items, type }: AdminEventsPanelProps) {
  return (
    <Panel className="space-y-4">
      <div>
        <h3 className="font-display text-2xl text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
      </div>

      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-[1.25rem] border border-black/5 bg-black/5 px-4 py-4 text-sm text-neutral-600">
              <p className="font-semibold text-ink">{item.productName}</p>

              {type === "clicks" ? (
                <>
                  <p className="mt-1">{(item as AdminClickEvent).storeName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-neutral-500">
                    {(item as AdminClickEvent).source}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 capitalize">{(item as AdminAlertEvent).reason.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Atual:{" "}
                    {(item as AdminAlertEvent).currentPrice == null
                      ? "-"
                      : formatCurrency((item as AdminAlertEvent).currentPrice ?? 0)}
                  </p>
                </>
              )}

              <p className="mt-3 text-xs text-neutral-500">{formatDate(item.createdAt)}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">Nenhum evento recente disponível.</p>
      )}
    </Panel>
  );
}
