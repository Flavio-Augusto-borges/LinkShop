import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";

import { AdminProductEditQueueView } from "@/features/admin/components/admin-product-edit-queue-view";
import { adminPageService } from "@/features/admin/services/admin-page.service";
import { AccessGuard } from "@/features/auth";

type AdminProductsEditQueuePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin - Fila de edicao",
  description: "Edicao em fila de produtos selecionados no painel administrativo."
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

export default async function AdminProductsEditQueuePage({ searchParams }: AdminProductsEditQueuePageProps) {
  noStore();
  const resolvedParams = await searchParams;
  const catalog = await adminPageService.getCatalogData();
  const queueIds = parseQueueIds(resolvedParams.ids);

  return (
    <AccessGuard
      allowedRoles={["admin"]}
      title="Somente administradores podem entrar aqui"
      description="A area de produtos e restrita para operacao interna."
    >
      <AdminProductEditQueueView initialCatalog={catalog} initialQueueIds={queueIds} />
    </AccessGuard>
  );
}
