import type { Metadata } from "next";

import { CatalogSearchView } from "@/features/catalog";
import { catalogService } from "@/features/catalog/services/catalog.service";
import type { CatalogFilters } from "@/features/catalog/types/catalog.types";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parseNumber(value: string | string[] | undefined) {
  const normalized = getSingleParam(value);

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePage(value: string | string[] | undefined) {
  const normalized = Number(getSingleParam(value) || 1);

  if (!Number.isFinite(normalized) || normalized < 1) {
    return 1;
  }

  return Math.floor(normalized);
}

function parseFilters(params: Record<string, string | string[] | undefined>): CatalogFilters {
  const sort = getSingleParam(params.ordem) as CatalogFilters["sort"];
  const storeId = getSingleParam(params.loja) as CatalogFilters["storeId"];
  const minDiscount = Number(getSingleParam(params.descontoMin) || 0);

  return {
    query: getSingleParam(params.q),
    category: getSingleParam(params.categoria),
    storeId: storeId || "",
    minPrice: parseNumber(params.precoMin),
    maxPrice: parseNumber(params.precoMax),
    minDiscount: Number.isFinite(minDiscount) ? minDiscount : 0,
    sort: sort || "relevance"
  };
}

function buildSearchMetadata(filters: CatalogFilters, page: number): Metadata {
  const scope = filters.query
    ? `Resultados para ${filters.query}`
    : filters.category
      ? `Ofertas em ${filters.category}`
      : "Buscar produtos";

  const descriptionParts = [
    "Compare precos entre marketplaces e encontre a melhor oferta do momento."
  ];

  if (filters.storeId) {
    descriptionParts.push("Filtros por loja aplicados.");
  }

  if (filters.minDiscount > 0) {
    descriptionParts.push(`Descontos de ${filters.minDiscount}% ou mais.`);
  }

  if (page > 1) {
    descriptionParts.push(`Pagina ${page} dos resultados.`);
  }

  return {
    title: scope,
    description: descriptionParts.join(" ")
  };
}

function buildPageHref(
  params: Record<string, string | string[] | undefined>,
  page: number
) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const single = getSingleParam(value);

    if (single && key !== "pagina") {
      nextParams.set(key, single);
    }
  });

  if (page > 1) {
    nextParams.set("pagina", String(page));
  }

  return `/buscar${nextParams.toString() ? `?${nextParams.toString()}` : ""}`;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const filters = parseFilters(resolvedParams);
  const page = parsePage(resolvedParams.pagina);

  return buildSearchMetadata(filters, page);
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const filters = parseFilters(resolvedParams);
  const page = parsePage(resolvedParams.pagina);
  const response = await catalogService.searchCatalog({
    ...filters,
    page,
    pageSize: 12
  });

  if (!response.ok) {
    throw new Error(response.error.message);
  }

  return (
    <CatalogSearchView
      result={response.data}
      buildPageHref={(targetPage) => buildPageHref(resolvedParams, targetPage)}
    />
  );
}
