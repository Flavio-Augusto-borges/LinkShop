"use client";

import { Panel } from "@/shared/ui/panel";

type SummaryItem = {
  label: string;
  value: string;
  hint: string;
};

type AdminSummaryCardsProps = {
  items: SummaryItem[];
};

export function AdminSummaryCards({ items }: AdminSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Panel key={item.label} className="space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-coral">{item.label}</p>
          <p className="font-display text-3xl text-ink">{item.value}</p>
          <p className="text-sm leading-6 text-neutral-500">{item.hint}</p>
        </Panel>
      ))}
    </div>
  );
}
