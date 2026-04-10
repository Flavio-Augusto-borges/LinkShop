import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";

import { AdminDashboard } from "@/features/admin";
import { adminPageService } from "@/features/admin/services/admin-page.service";
import { AccessGuard } from "@/features/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Painel interno",
  description:
    "Visao operacional inicial com observabilidade do produto e gestao do catalogo.",
};

export default async function AdminPage() {
  noStore();
  const initialData = await adminPageService.getInitialData();

  return (
    <AccessGuard
      allowedRoles={["admin"]}
      title="Somente administradores podem entrar aqui"
      description="A area interna usa a mesma base integrada do produto e expoe a superficie operacional inicial."
    >
      <AdminDashboard
        initialCatalog={initialData.catalog}
        initialDashboard={initialData.dashboard}
      />
    </AccessGuard>
  );
}
