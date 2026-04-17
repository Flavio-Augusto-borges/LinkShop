import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";

import { AdminProductsManageView } from "@/features/admin/components/admin-products-manage-view";
import { adminPageService } from "@/features/admin/services/admin-page.service";
import { AccessGuard } from "@/features/auth";

type AdminProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin - Produtos",
  description: "Gestao administrativa de produtos publicados no catalogo."
};

function parseQueueIds(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] ?? "" : value ?? "";
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  noStore();
  const resolvedParams = await searchParams;
  const catalog = await adminPageService.getCatalogData();
  const queueIds = parseQueueIds(resolvedParams.queue);

  return (
    <AccessGuard
      allowedRoles={["admin"]}
      title="Somente administradores podem entrar aqui"
      description="A area de produtos e restrita para operacao interna."
    >
      <AdminProductsManageView initialCatalog={catalog} initialQueueIds={queueIds} />
    </AccessGuard>
  );
}
