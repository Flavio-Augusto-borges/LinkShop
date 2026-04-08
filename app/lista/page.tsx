import type { Metadata } from "next";

import { CartPageView } from "@/features/cart";

export const metadata: Metadata = {
  title: "Sua lista comparativa",
  description: "Revise produtos salvos, acompanhe quantidades e siga para a melhor oferta."
};

export default function CompareListPage() {
  return <CartPageView />;
}
