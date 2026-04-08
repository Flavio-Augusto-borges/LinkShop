export function getBackendApiBaseUrl() {
  const publicApiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

  if (typeof window === "undefined") {
    const internalApiBaseUrl = (process.env.BACKEND_INTERNAL_API_BASE_URL ?? "").replace(/\/$/, "");
    return internalApiBaseUrl || publicApiBaseUrl;
  }

  return publicApiBaseUrl;
}

export function getBackendBaseUrl() {
  return getBackendApiBaseUrl().replace(/\/api$/, "");
}

export function isBackendIntegrationEnabled() {
  return getBackendApiBaseUrl().length > 0;
}
