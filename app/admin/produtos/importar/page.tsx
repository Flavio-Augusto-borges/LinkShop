import type { Metadata } from "next";

import { AdminProductImportView } from "@/features/admin/components/admin-product-import-view";
import { AccessGuard } from "@/features/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin • Importar produtos",
  description: "Importacao por link ou lote para fila de revisao administrativa."
};

export default function AdminProductImportPage() {
  return (
    <AccessGuard
      allowedRoles={["admin"]}
      title="Somente administradores podem entrar aqui"
      description="A area de produtos e restrita para operacao interna."
    >
      <AdminProductImportView />
    </AccessGuard>
  );
}
