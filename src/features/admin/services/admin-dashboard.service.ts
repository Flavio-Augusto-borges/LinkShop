import type {
  AdminAlertAnalytics,
  AdminAlertEvent,
  AdminClickAnalytics,
  AdminClickEvent,
  AdminDashboardData,
  AdminHealthStatus,
  AdminOperationalSummary,
  AdminRankingDiagnostic
} from "@/features/admin/types/admin.types";
import { apiClient } from "@/shared/api/api-client";
import { getBackendBaseUrl, isBackendIntegrationEnabled } from "@/shared/api/api-config";
import { mockSuccess } from "@/shared/lib/async";
import type { ApiResponse } from "@/shared/types/api.types";

type BackendAnalyticsCountItem = {
  id: string;
  label: string;
  count: number;
};

type BackendAnalyticsSourceItem = {
  source: string;
  count: number;
};

type BackendAnalyticsTimeBucket = {
  date: string;
  count: number;
};

type BackendClickAnalytics = {
  period_days: number;
  total_clicks: number;
  top_products: BackendAnalyticsCountItem[];
  top_offers: BackendAnalyticsCountItem[];
  top_stores: BackendAnalyticsCountItem[];
  clicks_by_source: BackendAnalyticsSourceItem[];
  clicks_by_day: BackendAnalyticsTimeBucket[];
};

type BackendAlertAnalytics = {
  period_days: number;
  total_alerts: number;
  alerts_by_reason: BackendAnalyticsSourceItem[];
  top_products: BackendAnalyticsCountItem[];
  top_watches: BackendAnalyticsCountItem[];
  alerts_by_day: BackendAnalyticsTimeBucket[];
};

type BackendPaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    page_size: number;
    total: number;
  };
};

type BackendClickEvent = {
  id: string;
  user_id: string | null;
  product_id: string;
  product_name: string;
  offer_id: string;
  offer_title: string;
  store_id: string;
  store_name: string;
  source: string;
  referrer: string | null;
  created_at: string;
};

type BackendAlertEvent = {
  id: string;
  price_watch_id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  offer_id: string | null;
  reason: string;
  status: string;
  message: string;
  current_price: number | string | null;
  target_price: number | string | null;
  previous_price: number | string | null;
  triggered: boolean;
  created_at: string;
};

type BackendHealthStatus = {
  status: "ok" | "ready" | "not_ready";
  checks?: Record<string, string>;
  meta?: Record<string, string | number | boolean>;
};

type BackendRankingOffer = {
  id: string;
  price: string | number;
  ranking_score: number | null;
  ranking_reason: string | null;
  store: {
    name: string;
  };
};

type BackendRankingPreview = {
  product_id: string;
  offers_count: number;
  lowest_price: string | number | null;
  best_offer_id: string | null;
  best_offer_score: number | null;
  best_offer_reason: string | null;
  offers: BackendRankingOffer[];
};

type BackendOperationalError = {
  flow?: string;
  message: string;
  code?: string | null;
  request_id?: string | null;
  occurred_at: string;
};

type BackendOperationalFlow = {
  metrics: Record<string, number>;
  last_error: BackendOperationalError | null;
};

type BackendOperationsSummary = {
  runtime: {
    generated_at: string;
    uptime_seconds: number;
    requests: {
      total: number;
      api: number;
      failed: number;
      server_error: number;
    };
    flows: Record<string, BackendOperationalFlow>;
    last_error: BackendOperationalError | null;
  };
  persistent: {
    total_sync_runs: number;
    total_click_events: number;
    total_alert_events: number;
    latest_sync_run: {
      status: string;
      started_at: string;
    } | null;
    latest_click_event: {
      created_at: string;
    } | null;
    latest_alert_event: {
      created_at: string;
    } | null;
  };
};

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

function mapClickAnalytics(payload: BackendClickAnalytics): AdminClickAnalytics {
  return {
    periodDays: payload.period_days,
    totalClicks: payload.total_clicks,
    topProducts: payload.top_products,
    topOffers: payload.top_offers,
    topStores: payload.top_stores,
    clicksBySource: payload.clicks_by_source,
    clicksByDay: payload.clicks_by_day
  };
}

function mapAlertAnalytics(payload: BackendAlertAnalytics): AdminAlertAnalytics {
  return {
    periodDays: payload.period_days,
    totalAlerts: payload.total_alerts,
    alertsByReason: payload.alerts_by_reason,
    topProducts: payload.top_products,
    topWatches: payload.top_watches,
    alertsByDay: payload.alerts_by_day
  };
}

function mapClickEvent(item: BackendClickEvent): AdminClickEvent {
  return {
    id: item.id,
    userId: item.user_id,
    productId: item.product_id,
    productName: item.product_name,
    offerId: item.offer_id,
    offerTitle: item.offer_title,
    storeId: item.store_id,
    storeName: item.store_name,
    source: item.source,
    referrer: item.referrer,
    createdAt: item.created_at
  };
}

function mapAlertEvent(item: BackendAlertEvent): AdminAlertEvent {
  return {
    id: item.id,
    priceWatchId: item.price_watch_id,
    userId: item.user_id,
    productId: item.product_id,
    productName: item.product_name,
    offerId: item.offer_id,
    reason: item.reason,
    status: item.status,
    message: item.message,
    currentPrice: item.current_price == null ? null : Number(item.current_price),
    targetPrice: item.target_price == null ? null : Number(item.target_price),
    previousPrice: item.previous_price == null ? null : Number(item.previous_price),
    triggered: item.triggered,
    createdAt: item.created_at
  };
}

function mapRankingDiagnostic(payload: BackendRankingPreview, productLabel: string): AdminRankingDiagnostic {
  const bestOffer = payload.offers.find((offer) => offer.id === payload.best_offer_id);

  return {
    productId: payload.product_id,
    productLabel,
    offersCount: payload.offers_count,
    lowestPrice: payload.lowest_price == null ? null : Number(payload.lowest_price),
    bestOfferId: payload.best_offer_id,
    bestOfferScore: payload.best_offer_score == null ? null : Number(payload.best_offer_score),
    bestOfferReason: payload.best_offer_reason,
    bestOfferPrice: bestOffer ? Number(bestOffer.price) : null,
    bestOfferStoreName: bestOffer?.store.name ?? null
  };
}

function mapOperationalError(entry: BackendOperationalError | null): AdminOperationalSummary["lastError"] {
  if (!entry) {
    return null;
  }

  return {
    flow: entry.flow,
    message: entry.message,
    code: entry.code,
    requestId: entry.request_id,
    occurredAt: entry.occurred_at
  };
}

function mapOperationalSummary(payload: BackendOperationsSummary): AdminOperationalSummary {
  return {
    generatedAt: payload.runtime.generated_at,
    uptimeSeconds: payload.runtime.uptime_seconds,
    requests: {
      total: payload.runtime.requests.total,
      api: payload.runtime.requests.api,
      failed: payload.runtime.requests.failed,
      serverError: payload.runtime.requests.server_error
    },
    flows: Object.entries(payload.runtime.flows).map(([name, value]) => ({
      name,
      metrics: value.metrics,
      lastError: mapOperationalError(value.last_error)
    })),
    lastError: mapOperationalError(payload.runtime.last_error),
    persistent: {
      totalSyncRuns: payload.persistent.total_sync_runs,
      totalClickEvents: payload.persistent.total_click_events,
      totalAlertEvents: payload.persistent.total_alert_events,
      latestSyncRunStatus: payload.persistent.latest_sync_run?.status ?? null,
      latestSyncRunAt: payload.persistent.latest_sync_run?.started_at ?? null,
      latestClickAt: payload.persistent.latest_click_event?.created_at ?? null,
      latestAlertAt: payload.persistent.latest_alert_event?.created_at ?? null
    }
  };
}

async function fetchHealthStatus(path: "/health" | "/health/ready"): Promise<AdminHealthStatus> {
  if (!isBackendIntegrationEnabled()) {
    return {
      status: "unknown",
      error: "Integracao com backend nao configurada."
    };
  }

  try {
    const response = await fetch(`${getBackendBaseUrl()}${path}`, { cache: "no-store" });
    const payload = (await response.json()) as BackendHealthStatus;

    if (!response.ok) {
      return {
        status: payload.status ?? "unknown",
        checks: payload.checks,
        meta: payload.meta,
        error: "Backend nao ficou pronto para responder esse check."
      };
    }

    return {
      status: payload.status,
      checks: payload.checks,
      meta: payload.meta
    };
  } catch {
    return {
      status: "unknown",
      error: "Falha ao consultar o backend."
    };
  }
}

export const adminDashboardService = {
  async getDashboardData(): Promise<ApiResponse<AdminDashboardData>> {
    if (!isBackendIntegrationEnabled()) {
      return mockSuccess(buildDashboardFallback("Backend nao configurado."));
    }

    try {
      const [clicksResponse, alertsResponse, clickEventsResponse, alertEventsResponse, operationsResponse, health, readiness] =
        await Promise.all([
          apiClient.get<BackendClickAnalytics>("/admin/analytics/clicks?periodDays=30"),
          apiClient.get<BackendAlertAnalytics>("/admin/analytics/alerts?periodDays=30"),
          apiClient.get<BackendPaginatedResponse<BackendClickEvent>>("/admin/analytics/click-events?page=1&pageSize=5"),
          apiClient.get<BackendPaginatedResponse<BackendAlertEvent>>("/admin/analytics/alert-events?page=1&pageSize=5"),
          apiClient.get<BackendOperationsSummary>("/admin/operations/summary"),
          fetchHealthStatus("/health"),
          fetchHealthStatus("/health/ready")
        ]);

      const rankingCandidates = clicksResponse.ok
        ? clicksResponse.data.top_products.slice(0, 3).map((item) => ({ id: item.id, label: item.label }))
        : [];

      const rankingResponses = await Promise.all(
        rankingCandidates.map(async (candidate) => {
          const response = await apiClient.get<BackendRankingPreview>(
            `/admin/ranking/products/${encodeURIComponent(candidate.id)}`
          );

          if (!response.ok) {
            return null;
          }

          return mapRankingDiagnostic(response.data, candidate.label);
        })
      );

      return mockSuccess({
        clickAnalytics: clicksResponse.ok ? mapClickAnalytics(clicksResponse.data) : null,
        alertAnalytics: alertsResponse.ok ? mapAlertAnalytics(alertsResponse.data) : null,
        operations: operationsResponse.ok ? mapOperationalSummary(operationsResponse.data) : null,
        rankingDiagnostics: rankingResponses.filter((entry): entry is AdminRankingDiagnostic => entry !== null),
        recentClickEvents: clickEventsResponse.ok ? clickEventsResponse.data.data.map(mapClickEvent) : [],
        recentAlertEvents: alertEventsResponse.ok ? alertEventsResponse.data.data.map(mapAlertEvent) : [],
        health,
        readiness
      });
    } catch {
      return mockSuccess(buildDashboardFallback("Falha ao conectar com o backend."));
    }
  }
};
