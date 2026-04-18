import { NextRequest, NextResponse } from "next/server";

import { mockOffers } from "@/features/product/data/mock-offers";
import { getBackendApiBaseUrl, isBackendIntegrationEnabled } from "@/shared/api/api-config";
import { getAccessTokenCookieName } from "@/shared/api/session-token";

type RouteContext = {
  params: Promise<{
    offerId: string;
  }>;
};

function findMockOfferRedirectUrl(offerId: string) {
  return mockOffers.find((offer) => offer.id === offerId)?.affiliateUrl ?? null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { offerId } = await context.params;

  if (!isBackendIntegrationEnabled()) {
    const fallbackUrl = findMockOfferRedirectUrl(offerId);

    if (!fallbackUrl) {
      return NextResponse.json({ detail: "Offer not found" }, { status: 404 });
    }

    return NextResponse.redirect(fallbackUrl, { status: 307 });
  }

  const token = request.cookies.get(getAccessTokenCookieName())?.value;
  const backendRedirectUrl = new URL(`${getBackendApiBaseUrl()}/redirect/${encodeURIComponent(offerId)}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    if (value) {
      backendRedirectUrl.searchParams.set(key, value);
    }
  });

  const response = await fetch(backendRedirectUrl.toString(), {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
    redirect: "manual"
  });

  const location = response.headers.get("location");

  if (location) {
    return NextResponse.redirect(location, { status: 307 });
  }

  if (response.status === 404) {
    return NextResponse.json({ detail: "Offer not found" }, { status: 404 });
  }

  return NextResponse.json({ detail: "Unable to redirect offer" }, { status: 502 });
}
