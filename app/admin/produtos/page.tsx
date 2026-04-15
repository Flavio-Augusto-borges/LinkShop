import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";

import { AdminProductsManageView } from "@/features/admin/components/admin-products-manage-view";
import { adminPageService } from "@/features/admin/services/admin-page.service";
import { AccessGuard } from "@/features/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin • Produtos",
  description: "Gestao administrativa de produtos publicados no catalogo."
};

export default async function AdminProductsPage() {
  noStore();
  const catalog = await adminPageService.getCatalogData();

  return (
    <AccessGuard
      allowedRoles={["admin"]}
      title="Somente administradores podem entrar aqui"
      description="A area de produtos e restrita para operacao interna."
    >
      <AdminProductsManageView initialCatalog={catalog} />
    </AccessGuard>
  );
}
