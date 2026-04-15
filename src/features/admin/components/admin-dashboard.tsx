"use client";

import { useMemo } from "react";

import { AdminEventsPanel } from "@/features/admin/components/admin-events-panel";
import { AdminHealthPanel } from "@/features/admin/components/admin-health-panel";
import { AdminOperationsPanel } from "@/features/admin/components/admin-operations-panel";
import { AdminRankingDiagnosticsPanel } from "@/features/admin/components/admin-ranking-diagnostics-panel";
import { AdminRankingPanel } from "@/features/admin/components/admin-ranking-panel";
import { AdminSectionNav } from "@/features/admin/components/admin-section-nav";
import { AdminSummaryCards } from "@/features/admin/components/admin-summary-cards";
import type { AdminDashboardData } from "@/features/admin/types/admin.types";
import { SectionHeading } from "@/shared/ui/section-heading";

type AdminDashboardProps = {
  initialDashboard: AdminDashboardData;
};

export function AdminDashboard({ initialDashboard }: AdminDashboardProps) {
  const analyticsUnavailable = !initialDashboard.clickAnalytics || !initialDashboard.alertAnalytics;

  const summaryItems = useMemo(
    () => [
      {
        label: "Cliques",
        value: String(initialDashboard.clickAnalytics?.totalClicks ?? 0),
        hint: "Total de cliques afiliados registrados no periodo observado."
      },
      {
        label: "Produto lider",
        value: initialDashboard.clickAnalytics?.topProducts[0]?.label ?? "-",
        hint: "Produto com maior volume recente de interesse."
      },
      {
        label: "Alertas",
        value: String(initialDashboard.alertAnalytics?.totalAlerts ?? 0),
        hint: "Alertas disparados pela engine no periodo observado."
      },
      {
        label: "Motivo lider",
        value: initialDashboard.alertAnalytics?.alertsByReason[0]?.source.replaceAll("_", " ") ?? "-",
        hint: "Motivo de alerta mais recorrente no ambiente."
      }
    ],
    [initialDashboard.alertAnalytics, initialDashboard.clickAnalytics]
  );

  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Admin"
        title="Painel operacional interno"
        description="Visao consolidada de metricas, saude da aplicacao e sinais de operacao apos o deploy."
      />
      <AdminSectionNav />

      <AdminSummaryCards items={summaryItems} />

      {analyticsUnavailable ? (
        <div className="mt-6 rounded-[1.75rem] border border-dashed border-black/10 bg-black/5 px-6 py-5 text-sm leading-6 text-neutral-600">
          Os endpoints internos de analytics nao responderam neste ambiente. Health e readiness continuam visiveis para
          diagnostico rapido.
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <AdminHealthPanel
          title="Liveness"
          description="Verificacao rapida para confirmar que a API esta respondendo."
          status={initialDashboard.health}
        />
        <AdminHealthPanel
          title="Readiness"
          description="Estado de prontidao do backend com banco e dependencias minimas."
          status={initialDashboard.readiness}
        />
      </div>

      <div className="mt-6">
        <AdminOperationsPanel summary={initialDashboard.operations} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <AdminRankingPanel
          title="Produtos mais clicados"
          description="Itens com maior volume recente de interesse."
          items={initialDashboard.clickAnalytics?.topProducts ?? []}
        />
        <AdminRankingPanel
          title="Lojas mais clicadas"
          description="Marketplaces que mais receberam cliques afiliados."
          items={initialDashboard.clickAnalytics?.topStores ?? []}
        />
        <AdminRankingPanel
          title="Alertas por motivo"
          description="Motivos mais frequentes de disparo da engine."
          items={initialDashboard.alertAnalytics?.alertsByReason ?? []}
        />
        <AdminRankingPanel
          title="Produtos com mais alertas"
          description="Itens que mais acionaram acompanhamento recentemente."
          items={initialDashboard.alertAnalytics?.topProducts ?? []}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <AdminEventsPanel
          title="Cliques recentes"
          description="Ultimos eventos de clique afiliado registrados no backend."
          items={initialDashboard.recentClickEvents}
          type="clicks"
        />
        <AdminEventsPanel
          title="Alertas recentes"
          description="Ultimos eventos disparados pela avaliacao de alertas."
          items={initialDashboard.recentAlertEvents}
          type="alerts"
        />
      </div>

      <div className="mt-6">
        <AdminRankingDiagnosticsPanel items={initialDashboard.rankingDiagnostics} />
      </div>
    </section>
  );
}
