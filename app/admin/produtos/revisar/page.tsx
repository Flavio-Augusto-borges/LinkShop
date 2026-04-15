import type { Metadata } from "next";

import { AdminProductReviewView } from "@/features/admin/components/admin-product-review-view";
import { AccessGuard } from "@/features/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin • Revisar importacoes",
  description: "Revisao manual de rascunhos importados antes da publicacao."
};

export default function AdminProductReviewPage() {
  return (
    <AccessGuard
      allowedRoles={["admin"]}
      title="Somente administradores podem entrar aqui"
      description="A area de produtos e restrita para operacao interna."
    >
      <AdminProductReviewView />
    </AccessGuard>
  );
}
