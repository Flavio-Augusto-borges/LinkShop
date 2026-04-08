import { authMockRepository } from "@/features/auth/data/auth.mock-repository";
import { apiClient } from "@/shared/api/api-client";
import { isBackendIntegrationEnabled } from "@/shared/api/api-config";
import {
  getStoredAccessExpiresAt,
  getStoredAccessToken,
  getStoredRefreshExpiresAt,
  getStoredRefreshToken
} from "@/shared/api/session-token";
import type {
  AuthSession,
  DemoAuthAccount,
  MockUserRecord,
  SignInInput,
  SignUpInput,
  User
} from "@/features/auth/types/auth.types";
import { mockFailure, mockSuccess } from "@/shared/lib/async";
import { safeUUID } from "@/shared/lib/uuid";
import type { ApiResponse } from "@/shared/types/api.types";

type BackendUser = {
  id: string;
  name: string;
  email: string;
  role: User["role"];
  created_at: string;
};

type BackendAuthSession = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: BackendUser;
  access_expires_at: string;
  refresh_expires_at: string;
  expires_at: string | null;
};

function mapBackendUser(user: BackendUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at
  };
}

function mapBackendSession(session: BackendAuthSession): AuthSession {
  return {
    token: session.access_token,
    refreshToken: session.refresh_token,
    user: mapBackendUser(session.user),
    accessExpiresAt: session.access_expires_at,
    refreshExpiresAt: session.refresh_expires_at,
    expiresAt: session.expires_at ?? session.access_expires_at
  };
}

function sanitizeUser(user: MockUserRecord): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

function buildSession(user: User): AuthSession {
  const accessExpiresAt = "2026-12-31T23:59:59.000Z";
  const refreshExpiresAt = "2027-01-31T23:59:59.000Z";
  return {
    token: `mock-session-${user.id}`,
    refreshToken: `mock-refresh-${user.id}`,
    user,
    accessExpiresAt,
    refreshExpiresAt,
    expiresAt: accessExpiresAt
  };
}

export const authService = {
  async signIn(input: SignInInput): Promise<ApiResponse<AuthSession>> {
    if (isBackendIntegrationEnabled()) {
      const response = await apiClient.post<BackendAuthSession>("/auth/login", input);

      if (!response.ok) {
        return response;
      }

      return {
        ...response,
        data: mapBackendSession(response.data)
      };
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    const user = authMockRepository.findUserByCredentials(normalizedEmail, input.password);

    if (!user) {
      return mockFailure("AUTH_INVALID_CREDENTIALS", "Email ou senha inválidos.");
    }

    return mockSuccess(buildSession(sanitizeUser(user)));
  },

  async signUp(input: SignUpInput): Promise<ApiResponse<AuthSession>> {
    if (isBackendIntegrationEnabled()) {
      const response = await apiClient.post<BackendAuthSession>("/auth/register", input);

      if (!response.ok) {
        return response;
      }

      return {
        ...response,
        data: mapBackendSession(response.data)
      };
    }

    const normalizedEmail = input.email.trim().toLowerCase();

    if (authMockRepository.findUserByEmail(normalizedEmail)) {
      return mockFailure("AUTH_EMAIL_ALREADY_EXISTS", "Já existe uma conta cadastrada com esse email.");
    }

    const createdUser: MockUserRecord = {
      id: safeUUID(),
      name: input.name.trim(),
      email: normalizedEmail,
      password: input.password,
      role: "user",
      createdAt: new Date().toISOString()
    };

    const persistedUser = authMockRepository.createUser(createdUser);

    return mockSuccess(buildSession(sanitizeUser(persistedUser)));
  },

  async getSessionByToken(token: string): Promise<ApiResponse<AuthSession | null>> {
    if (isBackendIntegrationEnabled()) {
      const response = await apiClient.get<BackendUser>("/auth/me", { token });

      if (!response.ok) {
        if (response.error.code === "HTTP_401") {
          return {
            ok: true,
            data: null,
            meta: response.meta
          };
        }

        return response;
      }

      return {
        ...response,
        data: {
          token: getStoredAccessToken() ?? token,
          refreshToken: getStoredRefreshToken() ?? "",
          user: mapBackendUser(response.data),
          accessExpiresAt: getStoredAccessExpiresAt() ?? new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          refreshExpiresAt:
            getStoredRefreshExpiresAt() ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: getStoredAccessExpiresAt() ?? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        }
      };
    }

    const userId = token.replace("mock-session-", "");
    const user = authMockRepository.findUserById(userId);

    if (!user) {
      return mockSuccess(null);
    }

    return mockSuccess(buildSession(sanitizeUser(user)));
  },

  async signOut(): Promise<ApiResponse<{ success: true }>> {
    if (isBackendIntegrationEnabled()) {
      const refreshToken = getStoredRefreshToken();
      const response = await apiClient.post<null>(
        "/auth/logout",
        { refresh_token: refreshToken },
        { token: getStoredAccessToken() }
      );

      if (!response.ok && response.error.code !== "HTTP_401") {
        return response;
      }

      return {
        ok: true,
        data: { success: true },
        meta: response.meta
      };
    }

    return mockSuccess({ success: true });
  },

  async refreshSession(): Promise<ApiResponse<AuthSession | null>> {
    if (!isBackendIntegrationEnabled()) {
      return mockSuccess(null);
    }

    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
      return mockSuccess(null);
    }

    const response = await apiClient.post<BackendAuthSession>(
      "/auth/refresh",
      { refresh_token: refreshToken },
      { skipAuthRefresh: true }
    );

    if (!response.ok) {
      if (response.error.code === "HTTP_401") {
        return mockSuccess(null);
      }

      return response;
    }

    return {
      ...response,
      data: mapBackendSession(response.data)
    };
  },

  async getDemoAccounts(): Promise<ApiResponse<DemoAuthAccount[]>> {
    return mockSuccess(
      authMockRepository.listUsers().map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role
      }))
    );
  }
};
