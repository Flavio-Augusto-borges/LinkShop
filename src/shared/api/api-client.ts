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
  timeoutMs?: number;
};

const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

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
        .map((entry) => (entry && typeof entry === "object" && "msg" in entry ? String(entry.msg) : "Erro de validacao"))
        .join(", ");
    }
  }

  return fallback;
}

function extractErrorCode(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const errorValue = payload.error;
    if (errorValue && typeof errorValue === "object" && "code" in errorValue) {
      return String(errorValue.code);
    }
  }

  return fallback;
}

function parseJsonPayload(text: string): { ok: true; data: unknown } | { ok: false } {
  if (!text) {
    return { ok: true, data: null };
  }

  try {
    return { ok: true, data: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

function createTimeoutController(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeout };
}

function isAbortError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message.toLowerCase().includes("aborted"))
  );
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

  const { controller, timeout } = createTimeoutController(DEFAULT_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getBackendApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      clearStoredAccessToken();
      return null;
    }

    const text = await response.text();
    const parsed = parseJsonPayload(text);
    if (!parsed.ok) {
      clearStoredAccessToken();
      return null;
    }

    const payload = parsed.data as BackendRefreshSession;
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
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
  if (!isBackendIntegrationEnabled()) {
    return {
      ok: false,
      error: {
        code: "BACKEND_NOT_CONFIGURED",
        message: "A integracao com o backend nao esta configurada."
      },
      meta: createMeta()
    };
  }

  const { controller, timeout } = createTimeoutController(options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS);

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
      cache: options.cache ?? "no-store",
      signal: controller.signal
    });

    const text = await response.text();
    const parsedPayload = parseJsonPayload(text);
    const payload = parsedPayload.ok ? parsedPayload.data : null;

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
          code: extractErrorCode(payload, `HTTP_${response.status}`),
          message: parsedPayload.ok
            ? extractErrorMessage(payload, "Nao foi possivel concluir a requisicao.")
            : `Backend retornou HTTP ${response.status}, mas a resposta nao veio em JSON valido.`
        },
        meta: createMeta()
      };
    }

    if (!parsedPayload.ok) {
      return {
        ok: false,
        error: {
          code: "INVALID_BACKEND_RESPONSE",
          message: "Backend retornou uma resposta invalida ou nao JSON."
        },
        meta: createMeta()
      };
    }

    return {
      ok: true,
      data: payload as T,
      meta: createMeta()
    };
  } catch (error) {
    if (isAbortError(error)) {
      return {
        ok: false,
        error: {
          code: "REQUEST_TIMEOUT",
          message: "Tempo limite ao conectar com o backend."
        },
        meta: createMeta()
      };
    }

    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: `Falha de rede ao conectar com o backend em ${getBackendApiBaseUrl()}.`
      },
      meta: createMeta()
    };
  } finally {
    globalThis.clearTimeout(timeout);
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
