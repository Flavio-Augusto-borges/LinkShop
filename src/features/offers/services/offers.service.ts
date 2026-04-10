import { offersMockRepository } from "@/features/offers/data/offers.mock-repository";
import { apiClient } from "@/shared/api/api-client";
import { isBackendIntegrationEnabled } from "@/shared/api/api-config";
import type { Offer } from "@/features/product/types/offer.types";
import type {
  PriceHistory,
  ProductPriceHistoryPoint,
  ProductPriceHistorySummary
} from "@/features/product/types/price-history.types";
import { mockSuccess } from "@/shared/lib/async";
import type { ApiResponse } from "@/shared/types/api.types";

type BackendOffer = {
  id: string;
  product_id: string;
  store_id: string;
  seller_name: string;
  title: string;
  affiliate_url: string;
  price: string | number;
  original_price: string | number | null;
  currency: "BRL";
  installment_text: string | null;
  shipping_cost: string | number | null;
  availability: Offer["availability"];
  is_featured: boolean;
  last_synced_at: string;
  ranking_score?: string | number | null;
  quality_score?: string | number | null;
  ranking_reason?: string | null;
  store: {
    code: Offer["storeId"];
  };
};

type BackendPriceHistoryResponse = {
  product_id: string;
  summary: {
    current_price: string | number | null;
    lowest_recent_price: string | number | null;
    highest_recent_price: string | number | null;
    variation_percentage: string | number | null;
    trend: ProductPriceHistorySummary["trend"];
    points_count: number;
  };
  points: Array<{
    id: string;
    product_id: string;
    offer_id: string;
    captured_at: string;
    price: string | number;
    original_price: string | number | null;
  }>;
};

function mapBackendOffer(offer: BackendOffer): Offer {
  return {
    id: offer.id,
    productId: offer.product_id,
    storeId: offer.store?.code ?? (offer.store_id as Offer["storeId"]),
    sellerName: offer.seller_name,
    title: offer.title,
    affiliateUrl: offer.affiliate_url,
    price: Number(offer.price),
    originalPrice: offer.original_price == null ? undefined : Number(offer.original_price),
    currency: offer.currency,
    installmentText: offer.installment_text ?? undefined,
    shippingCost: offer.shipping_cost == null ? undefined : Number(offer.shipping_cost),
    availability: offer.availability,
    isFeatured: offer.is_featured,
    lastSyncedAt: offer.last_synced_at,
    rankingScore: offer.ranking_score == null ? undefined : Number(offer.ranking_score),
    qualityScore: offer.quality_score == null ? undefined : Number(offer.quality_score),
    rankingReason: offer.ranking_reason ?? undefined
  };
}

function formatPointLabel(dateValue: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short"
  }).format(new Date(dateValue));
}

function buildHistoryPoints(history: PriceHistory[]): ProductPriceHistoryPoint[] {
  const groupedByDate = new Map<string, number>();

  [...history]
    .sort((first, second) => new Date(first.capturedAt).getTime() - new Date(second.capturedAt).getTime())
    .forEach((entry) => {
      const dateKey = entry.capturedAt.slice(0, 10);
      const current = groupedByDate.get(dateKey);

      if (current === undefined || entry.price < current) {
        groupedByDate.set(dateKey, entry.price);
      }
    });

  return [...groupedByDate.entries()].map(([capturedAt, price]) => ({
    capturedAt,
    label: formatPointLabel(capturedAt),
    price
  }));
}

function calculateVariation(points: ProductPriceHistoryPoint[]) {
  if (points.length < 2) {
    return 0;
  }

  const first = points[0]?.price ?? 0;
  const last = points[points.length - 1]?.price ?? 0;

  if (!first) {
    return 0;
  }

  return Number((((last - first) / first) * 100).toFixed(1));
}

export const offersService = {
  async getOffersByProductId(productId: string): Promise<ApiResponse<Offer[]>> {
    if (isBackendIntegrationEnabled()) {
      const response = await apiClient.get<BackendOffer[]>(`/offers?productId=${encodeURIComponent(productId)}`);

      if (response.ok) {
        return {
          ...response,
          data: response.data.map(mapBackendOffer)
        };
      }
    }

    const offers = offersMockRepository
      .listOffers()
      .filter((offer) => offer.productId === productId)
      .sort((first, second) => first.price - second.price);
    return mockSuccess(offers);
  },

  async getBestOfferByProductId(productId: string): Promise<ApiResponse<Offer | null>> {
    if (isBackendIntegrationEnabled()) {
      const response = await this.getOffersByProductId(productId);

      if (!response.ok) {
        return response;
      }

      return {
        ...response,
        data: response.data[0] ?? null
      };
    }

    const offers = offersMockRepository
      .listOffers()
      .filter((offer) => offer.productId === productId)
      .sort((first, second) => first.price - second.price);

    return mockSuccess(offers[0] ?? null);
  },

  async getPriceHistoryByOfferId(offerId: string): Promise<ApiResponse<PriceHistory[]>> {
    const history = offersMockRepository
      .listPriceHistory()
      .filter((entry) => entry.offerId === offerId)
      .sort((first, second) => new Date(first.capturedAt).getTime() - new Date(second.capturedAt).getTime());
    return mockSuccess(history);
  },

  async getProductPriceHistorySummary(productId: string): Promise<ApiResponse<ProductPriceHistorySummary>> {
    if (isBackendIntegrationEnabled()) {
      const response = await apiClient.get<BackendPriceHistoryResponse>(
        `/products/${encodeURIComponent(productId)}/price-history`
      );

      if (response.ok) {
        const points = response.data.points.map((point) => ({
          capturedAt: point.captured_at,
          label: formatPointLabel(point.captured_at),
          price: Number(point.price)
        }));

        return {
          ...response,
          data: {
            currentPrice:
              response.data.summary.current_price == null ? null : Number(response.data.summary.current_price),
            lowestRecentPrice:
              response.data.summary.lowest_recent_price == null
                ? null
                : Number(response.data.summary.lowest_recent_price),
            highestRecentPrice:
              response.data.summary.highest_recent_price == null
                ? null
                : Number(response.data.summary.highest_recent_price),
            variationPercentage:
              response.data.summary.variation_percentage == null
                ? 0
                : Number(response.data.summary.variation_percentage),
            trend: response.data.summary.trend,
            points,
            sampleSize: response.data.summary.points_count
          }
        };
      }
    }

    const history = offersMockRepository
      .listPriceHistory()
      .filter((entry) => entry.productId === productId)
      .sort((first, second) => new Date(first.capturedAt).getTime() - new Date(second.capturedAt).getTime());

    const points = buildHistoryPoints(history);
    const prices = points.map((point) => point.price);
    const currentPrice = prices[prices.length - 1] ?? null;
    const lowestRecentPrice = prices.length ? Math.min(...prices) : null;
    const highestRecentPrice = prices.length ? Math.max(...prices) : null;
    const variationPercentage = calculateVariation(points);
    const trend =
      variationPercentage < 0 ? "down" : variationPercentage > 0 ? "up" : "stable";

    return mockSuccess({
      currentPrice,
      lowestRecentPrice,
      highestRecentPrice,
      variationPercentage,
      trend,
      points,
      sampleSize: points.length
    });
  }
};
