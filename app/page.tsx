import type { Metadata } from "next";

import { CatalogHomeView } from "@/features/catalog";
import { catalogService } from "@/features/catalog/services/catalog.service";

export const metadata: Metadata = {
  title: "Compare precos e descubra as melhores ofertas",
  description: "Pesquise produtos, compare ofertas entre marketplaces e encontre a melhor compra com mais clareza e rapidez."
};

export default async function HomePage() {
  const response = await catalogService.getHomeSections();

  if (!response.ok) {
    throw new Error(response.error.message);
  }

  return <CatalogHomeView sections={response.data} />;
}
