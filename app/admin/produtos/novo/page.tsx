import type { Metadata } from "next";

import { AdminProductCreateView } from "@/features/admin/components/admin-product-create-view";
import { AccessGuard } from "@/features/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin • Novo produto",
  description: "Cadastro manual de novos produtos no catalogo."
};

export default function AdminProductCreatePage() {
  return (
    <AccessGuard
      allowedRoles={["admin"]}
      title="Somente administradores podem entrar aqui"
      description="A area de produtos e restrita para operacao interna."
    >
      <AdminProductCreateView />
    </AccessGuard>
  );
}
