import type { Metadata } from "next";

import { FavoritesPageView } from "@/features/favorites";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Acompanhe produtos salvos e retome sua comparacao de precos quando quiser."
};

export default function FavoritesPage() {
  return <FavoritesPageView />;
}
