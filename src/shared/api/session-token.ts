const ACCESS_TOKEN_KEY = "linkshop-access-token";
const REFRESH_TOKEN_KEY = "linkshop-refresh-token";
const ACCESS_EXPIRES_AT_KEY = "linkshop-access-expires-at";
const REFRESH_EXPIRES_AT_KEY = "linkshop-refresh-expires-at";
const ACCESS_TOKEN_COOKIE = "linkshop-access-token";

function getCookieSecuritySuffix() {
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return "; Secure";
  }

  return "";
}

function setAccessTokenCookie(token: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Lax${getCookieSecuritySuffix()}`;
}

function clearAccessTokenCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${getCookieSecuritySuffix()}`;
}

export function getAccessTokenCookieName() {
  return ACCESS_TOKEN_COOKIE;
}

export function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredAccessExpiresAt() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_EXPIRES_AT_KEY);
}

export function getStoredRefreshExpiresAt() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(REFRESH_EXPIRES_AT_KEY);
}

export function setStoredAccessToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  setAccessTokenCookie(token);
}

export function setStoredSessionTokens(payload: {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
}) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  window.localStorage.setItem(ACCESS_EXPIRES_AT_KEY, payload.accessExpiresAt);
  window.localStorage.setItem(REFRESH_EXPIRES_AT_KEY, payload.refreshExpiresAt);
  setAccessTokenCookie(payload.accessToken);
}

export function clearStoredAccessToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(ACCESS_EXPIRES_AT_KEY);
  window.localStorage.removeItem(REFRESH_EXPIRES_AT_KEY);
  clearAccessTokenCookie();
}
