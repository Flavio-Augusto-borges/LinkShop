import { getBackendApiBaseUrl, isBackendIntegrationEnabled } from "@/shared/api/api-config";
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredSessionTokens
} from "@/shared/api/session-token";
import { safeUUID } from "@/shared/lib/uuid";
import type { ApiResponse } from "@/shared/types/api.types";

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
  headers?: HeadersInit;
  cache?: RequestCache;
  skipAuthRefresh?: boolean;
};

function createMeta() {
  return {
    requestId: safeUUID(),
    timestamp: new Date().toISOString(),
    source: "backend" as const
  };
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const errorValue = payload.error;
    if (errorValue && typeof errorValue === "object" && "message" in errorValue) {
      return String(errorValue.message);
    }
  }

  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = payload.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((entry) => (entry && typeof entry === "object" && "msg" in entry ? String(entry.msg) : "Erro de validação"))
        .join(", ");
    }
  }

  return fallback;
}

type BackendRefreshSession = {
  access_token: string;
  refresh_token: string;
  access_expires_at: string;
  refresh_expires_at: string;
};

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    clearStoredAccessToken();
    return null;
  }

  try {
    const response = await fetch(`${getBackendApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store"
    });

    if (!response.ok) {
      clearStoredAccessToken();
      return null;
    }

    const payload = (await response.json()) as BackendRefreshSession;
    setStoredSessionTokens({
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      accessExpiresAt: payload.access_expires_at,
      refreshExpiresAt: payload.refresh_expires_at
    });
    return payload.access_token;
  } catch {
    clearStoredAccessToken();
    return null;
  }
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
  if (!isBackendIntegrationEnabled()) {
    return {
      ok: false,
      error: {
        code: "BACKEND_NOT_CONFIGURED",
        message: "A integração com o backend não está configurada."
      },
      meta: createMeta()
    };
  }

  try {
    const resolvedToken = options.token ?? getStoredAccessToken();
    const response = await fetch(`${getBackendApiBaseUrl()}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
        ...options.headers
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: options.cache ?? "no-store"
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as unknown) : null;

    if (
      response.status === 401 &&
      !options.skipAuthRefresh &&
      !path.startsWith("/auth/login") &&
      !path.startsWith("/auth/register") &&
      !path.startsWith("/auth/refresh") &&
      !path.startsWith("/auth/logout") &&
      getStoredRefreshToken()
    ) {
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        return request<T>(path, { ...options, token: refreshedToken, skipAuthRefresh: true });
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: `HTTP_${response.status}`,
          message: extractErrorMessage(payload, "Não foi possível concluir a requisição.")
        },
        meta: createMeta()
      };
    }

    return {
      ok: true,
      data: payload as T,
      meta: createMeta()
    };
  } catch {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Falha ao conectar com o backend."
      },
      meta: createMeta()
    };
  }
}

export const apiClient = {
  get<T>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return request<T>(path, options);
  },
  post<T>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return request<T>(path, { ...options, method: "POST", body });
  },
  patch<T>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return request<T>(path, { ...options, method: "PATCH", body });
  },
  delete<T>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return request<T>(path, { ...options, method: "DELETE" });
  }
};
