import type { Metadata } from "next";

import { AdminDashboard } from "@/features/admin";
import { adminDashboardService } from "@/features/admin/services/admin-dashboard.service";
import { AccessGuard } from "@/features/auth";
import { catalogService } from "@/features/catalog/services/catalog.service";

export const metadata: Metadata = {
  title: "Painel interno",
  description: "Visao operacional inicial com observabilidade do produto e gestao do catalogo."
};

export default async function AdminPage() {
  const [catalogResponse, dashboardResponse] = await Promise.all([
    catalogService.getCatalogBootstrap(),
    adminDashboardService.getDashboardData()
  ]);

  if (!catalogResponse.ok) {
    throw new Error(catalogResponse.error.message);
  }

  if (!dashboardResponse.ok) {
    throw new Error(dashboardResponse.error.message);
  }

  return (
    <AccessGuard
      allowedRoles={["admin"]}
      title="Somente administradores podem entrar aqui"
      description="A area interna usa a mesma base integrada do produto e expoe a superficie operacional inicial."
    >
      <AdminDashboard initialCatalog={catalogResponse.data} initialDashboard={dashboardResponse.data} />
    </AccessGuard>
  );
}
