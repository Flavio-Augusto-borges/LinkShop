#!/usr/bin/env node

const DEFAULT_FRONTEND_BASE_URL = "http://127.0.0.1:3000";
const DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:8000";

function normalizeBaseUrl(value, fallback) {
  const base = (value || fallback || "").trim().replace(/\/$/, "");
  if (!base) {
    throw new Error("Base URL is required");
  }
  return base;
}

function buildConfig() {
  const frontendBaseUrl = normalizeBaseUrl(process.env.FULLSTACK_FRONTEND_BASE_URL, DEFAULT_FRONTEND_BASE_URL);
  const backendBaseUrl = normalizeBaseUrl(process.env.FULLSTACK_BACKEND_BASE_URL, DEFAULT_BACKEND_BASE_URL);
  const apiBaseUrl = normalizeBaseUrl(
    process.env.FULLSTACK_API_BASE_URL,
    `${backendBaseUrl}/api`
  );

  return {
    frontendBaseUrl,
    backendBaseUrl,
    apiBaseUrl,
    userEmail: process.env.FULLSTACK_USER_EMAIL || "user@linkshop.dev",
    userPassword: process.env.FULLSTACK_USER_PASSWORD || "123456",
    adminEmail: process.env.FULLSTACK_ADMIN_EMAIL || "admin@linkshop.dev",
    adminPassword: process.env.FULLSTACK_ADMIN_PASSWORD || "123456",
    productSlug: process.env.FULLSTACK_PRODUCT_SLUG || "iphone-15-128gb",
    productId: process.env.FULLSTACK_PRODUCT_ID || "product-iphone-15-128",
    offerId: process.env.FULLSTACK_OFFER_ID || "offer-iphone-mercado-livre",
    includeDevEndpoints: (process.env.FULLSTACK_INCLUDE_DEV_ENDPOINTS || "false").toLowerCase() === "true"
  };
}

class FullstackSmokeRunner {
  constructor(config) {
    this.config = config;
    this.results = [];
    this.userSession = null;
    this.adminSession = null;
  }

  async run() {
    const checks = [
      ["frontend_home", () => this.checkFrontendPage("/")],
      ["frontend_search", () => this.checkFrontendPage("/buscar?q=iphone")],
      ["frontend_product", () => this.checkFrontendPage(`/ofertas/${encodeURIComponent(this.config.productSlug)}`)],
      ["backend_health", () => this.checkBackendHealth("/health", "ok")],
      ["backend_readiness", () => this.checkBackendHealth("/health/ready", "ready")],
      ["auth_user_login", () => this.checkUserLogin()],
      ["auth_user_me", () => this.checkUserMe()],
      ["auth_refresh", () => this.checkRefresh()],
      ["favorites_list", () => this.checkUserList("/me/favorites")],
      ["compare_list", () => this.checkUserList("/me/compare-list")],
      ["price_watches_list", () => this.checkUserList("/me/price-watches")],
      ["sync_anonymous", () => this.checkAnonymousSync()],
      ["frontend_redirect_tracking", () => this.checkFrontendRedirect()],
      ["admin_page_load", () => this.checkFrontendPage("/admin")],
      ["auth_admin_login", () => this.checkAdminLogin()]
    ];

    if (this.config.includeDevEndpoints) {
      checks.push(["admin_analytics_dev", () => this.checkAdminAnalytics()]);
    }

    for (const [name, fn] of checks) {
      await this.runCheck(name, fn);
    }

    const failed = this.results.filter((entry) => entry.status !== "ok");
    const output = {
      frontend_base_url: this.config.frontendBaseUrl,
      backend_base_url: this.config.backendBaseUrl,
      api_base_url: this.config.apiBaseUrl,
      results: this.results
    };
    console.log(JSON.stringify(output, null, 2));
    return failed.length ? 1 : 0;
  }

  async runCheck(name, fn) {
    try {
      const details = await fn();
      this.results.push({ name, status: "ok", details });
    } catch (error) {
      this.results.push({ name, status: "failed", error: error instanceof Error ? error.message : String(error) });
    }
  }

  async fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const text = await response.text();
    let payload = null;
    if (text) {
      payload = JSON.parse(text);
    }
    return { response, payload };
  }

  async checkFrontendPage(path) {
    const { response } = await this.fetchJson(`${this.config.frontendBaseUrl}${path}`, {
      method: "GET",
      headers: { Accept: "text/html" }
    });
    if (!response.ok) {
      throw new Error(`Expected 2xx for ${path}, got ${response.status}`);
    }
    return { status_code: response.status };
  }

  async checkBackendHealth(path, expectedStatus) {
    const { response, payload } = await this.fetchJson(`${this.config.backendBaseUrl}${path}`, {
      method: "GET",
      headers: { Accept: "application/json" }
    });
    if (!response.ok || payload?.status !== expectedStatus) {
      throw new Error(`Unexpected health response for ${path}: status=${response.status} payload=${JSON.stringify(payload)}`);
    }
    return payload;
  }

  async checkUserLogin() {
    const { response, payload } = await this.fetchJson(`${this.config.apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: this.config.userEmail,
        password: this.config.userPassword
      })
    });

    if (!response.ok || !payload?.access_token || !payload?.refresh_token) {
      throw new Error(`User login failed: status=${response.status} payload=${JSON.stringify(payload)}`);
    }

    this.userSession = payload;
    return { user_id: payload.user?.id, email: payload.user?.email };
  }

  async checkAdminLogin() {
    const { response, payload } = await this.fetchJson(`${this.config.apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: this.config.adminEmail,
        password: this.config.adminPassword
      })
    });

    if (!response.ok || !payload?.access_token) {
      throw new Error(`Admin login failed: status=${response.status} payload=${JSON.stringify(payload)}`);
    }

    this.adminSession = payload;
    return { user_id: payload.user?.id, email: payload.user?.email, role: payload.user?.role };
  }

  async checkUserMe() {
    if (!this.userSession) {
      throw new Error("User session not initialized");
    }
    const { response, payload } = await this.fetchJson(`${this.config.apiBaseUrl}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.userSession.access_token}`,
        Accept: "application/json"
      }
    });
    if (!response.ok || payload?.email !== this.config.userEmail) {
      throw new Error(`User /auth/me failed: status=${response.status} payload=${JSON.stringify(payload)}`);
    }
    return { id: payload.id, email: payload.email, role: payload.role };
  }

  async checkRefresh() {
    if (!this.userSession) {
      throw new Error("User session not initialized");
    }
    const { response, payload } = await this.fetchJson(`${this.config.apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: this.userSession.refresh_token })
    });
    if (!response.ok || !payload?.access_token || !payload?.refresh_token) {
      throw new Error(`Auth refresh failed: status=${response.status} payload=${JSON.stringify(payload)}`);
    }
    this.userSession = payload;
    return {
      access_expires_at: payload.access_expires_at,
      refresh_expires_at: payload.refresh_expires_at
    };
  }

  async checkUserList(path) {
    if (!this.userSession) {
      throw new Error("User session not initialized");
    }
    const { response, payload } = await this.fetchJson(`${this.config.apiBaseUrl}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.userSession.access_token}`,
        Accept: "application/json"
      }
    });
    if (!response.ok || !Array.isArray(payload)) {
      throw new Error(`List endpoint failed for ${path}: status=${response.status} payload=${JSON.stringify(payload)}`);
    }
    return { count: payload.length };
  }

  async checkAnonymousSync() {
    if (!this.userSession) {
      throw new Error("User session not initialized");
    }

    const body = {
      anonymous_session_id: "fullstack-smoke-external",
      favorites: [{ product_id: this.config.productId }],
      compare_list: [{ product_id: this.config.productId, offer_id: this.config.offerId, quantity: 1 }],
      price_watches: [
        {
          product_id: this.config.productId,
          is_active: true,
          last_known_price: 4399.0,
          target_price: 4299.0,
          notify_on_price_drop: true,
          notify_on_new_best_offer: true
        }
      ]
    };

    const { response, payload } = await this.fetchJson(`${this.config.apiBaseUrl}/sync/anonymous`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.userSession.access_token}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok || !payload || !Array.isArray(payload.favorites)) {
      throw new Error(`Anonymous sync failed: status=${response.status} payload=${JSON.stringify(payload)}`);
    }

    return {
      favorites: payload.favorites.length,
      compare_list: Array.isArray(payload.compare_list) ? payload.compare_list.length : 0,
      price_watches: Array.isArray(payload.price_watches) ? payload.price_watches.length : 0
    };
  }

  async checkFrontendRedirect() {
    const response = await fetch(
      `${this.config.frontendBaseUrl}/api/redirect/${encodeURIComponent(this.config.offerId)}?source=fullstack-smoke`,
      {
        method: "GET",
        redirect: "manual"
      }
    );

    const location = response.headers.get("location");
    if (![302, 307, 308].includes(response.status) || !location) {
      throw new Error(`Frontend redirect failed: status=${response.status} location=${location}`);
    }

    return {
      status_code: response.status,
      location
    };
  }

  async checkAdminAnalytics() {
    if (!this.adminSession) {
      throw new Error("Admin session not initialized");
    }

    const { response, payload } = await this.fetchJson(`${this.config.apiBaseUrl}/admin/analytics/clicks?periodDays=30`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.adminSession.access_token}`,
        Accept: "application/json"
      }
    });

    if (!response.ok || typeof payload?.total_clicks !== "number") {
      throw new Error(`Admin analytics check failed: status=${response.status} payload=${JSON.stringify(payload)}`);
    }

    return { total_clicks: payload.total_clicks };
  }
}

const config = buildConfig();
const runner = new FullstackSmokeRunner(config);
runner.run().then((code) => process.exit(code));
