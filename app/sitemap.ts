import type { MetadataRoute } from "next";

import { catalogService } from "@/features/catalog/services/catalog.service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const response = await catalogService.getAllCatalogItems();

  if (!response.ok) {
    return [];
  }

  return [
    {
      url: "https://linkshop.example",
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: "https://linkshop.example/admin",
      changeFrequency: "weekly",
      priority: 0.4
    },
    ...response.data.map((item) => ({
      url: `https://linkshop.example/ofertas/${item.product.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7
    }))
  ];
}
