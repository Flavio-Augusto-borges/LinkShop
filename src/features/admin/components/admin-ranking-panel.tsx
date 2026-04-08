"use client";

import type { AdminCountItem, AdminSourceItem } from "@/features/admin/types/admin.types";
import { Panel } from "@/shared/ui/panel";

type RankingItem = AdminCountItem | AdminSourceItem;

type AdminRankingPanelProps = {
  title: string;
  description: string;
  items: RankingItem[];
};

function getLabel(item: RankingItem) {
  return "label" in item ? item.label : item.source;
}

export function AdminRankingPanel({ title, description, items }: AdminRankingPanelProps) {
  return (
    <Panel className="space-y-4">
      <div>
        <h3 className="font-display text-2xl text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
      </div>

      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={"id" in item ? item.id : item.source} className="flex items-center justify-between rounded-2xl bg-black/5 px-4 py-3">
              <span className="text-sm text-neutral-700">{getLabel(item)}</span>
              <strong className="font-display text-lg text-ink">{item.count}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">Nenhum dado disponível ainda.</p>
      )}
    </Panel>
  );
}
