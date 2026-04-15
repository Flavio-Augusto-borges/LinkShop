import { adminDashboardService } from "@/features/admin/services/admin-dashboard.service";
import { catalogService } from "@/features/catalog/services/catalog.service";
import type { CatalogSearchResult } from "@/features/catalog/types/catalog.types";
import type { AdminDashboardData } from "@/features/admin/types/admin.types";

function buildCatalogFallback(message: string): {
  data: CatalogSearchResult;
  warning: string;
} {
  return {
    warning: message,
    data: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 12,
      availableCategories: [],
      availableStores: [],
      appliedFilters: {
        query: "",
        category: "",
        storeId: "",
        minPrice: null,
        maxPrice: null,
        minDiscount: 0,
        sort: "relevance"
      }
    }
  };
}

function buildDashboardFallback(message: string): AdminDashboardData {
  return {
    clickAnalytics: null,
    alertAnalytics: null,
    operations: null,
    rankingDiagnostics: [],
    recentClickEvents: [],
    recentAlertEvents: [],
    health: { status: "unknown", error: message },
    readiness: { status: "unknown", error: message }
  };
}

export const adminPageService = {
  async getDashboardData(): Promise<AdminDashboardData> {
    const dashboardResponse = await adminDashboardService.getDashboardData();
    return dashboardResponse.ok
      ? dashboardResponse.data
      : buildDashboardFallback("Falha ao conectar com o backend.");
  },

  async getCatalogData(): Promise<CatalogSearchResult> {
    const catalogResponse = await catalogService.getCatalogBootstrap();
    return catalogResponse.ok
      ? catalogResponse.data
      : buildCatalogFallback("Catalogo indisponivel no momento.").data;
  },

  async getInitialData(): Promise<{
    catalog: CatalogSearchResult;
    dashboard: AdminDashboardData;
  }> {
    const [catalog, dashboard] = await Promise.all([
      this.getCatalogData(),
      this.getDashboardData()
    ]);

    return { catalog, dashboard };
  }
};
