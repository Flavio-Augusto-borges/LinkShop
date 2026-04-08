import json
import os
import sys
from dataclasses import dataclass
from typing import Any
from urllib import error, request


@dataclass(frozen=True)
class SmokeConfig:
    base_url: str
    auth_email: str
    auth_password: str
    product_id: str
    offer_id: str
    include_dev_endpoints: bool


class NoRedirectHandler(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class SmokeRunner:
    def __init__(self, config: SmokeConfig) -> None:
        self.config = config
        self.results: list[dict[str, Any]] = []
        self.token: str | None = None

    def run(self) -> int:
        checks = [
            ("health", self.check_health),
            ("readiness", self.check_readiness),
            ("auth_login", self.check_auth_login),
            ("auth_me", self.check_auth_me),
            ("products_list", self.check_products_list),
            ("product_detail", self.check_product_detail),
            ("redirect_tracking", self.check_redirect_tracking),
            ("anonymous_sync", self.check_anonymous_sync),
        ]

        if self.config.include_dev_endpoints:
            checks.extend(
                [
                    ("dev_alert_evaluation", self.check_dev_alert_evaluation),
                    ("admin_analytics", self.check_admin_analytics),
                    ("admin_operations", self.check_admin_operations),
                ]
            )

        for name, callback in checks:
            self._run_check(name, callback)

        print(json.dumps({"base_url": self.config.base_url, "results": self.results}, indent=2))
        failed = [result for result in self.results if result["status"] != "ok"]
        return 1 if failed else 0

    def _run_check(self, name: str, callback) -> None:
        try:
            details = callback()
            self.results.append({"name": name, "status": "ok", "details": details})
        except Exception as exc:  # noqa: BLE001
            self.results.append({"name": name, "status": "failed", "error": str(exc)})

    def _request_json(
        self,
        method: str,
        path: str,
        *,
        body: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> tuple[int, dict[str, Any], dict[str, str]]:
        payload = None
        request_headers = {"Content-Type": "application/json"}
        if headers:
            request_headers.update(headers)
        if body is not None:
            payload = json.dumps(body).encode("utf-8")

        req = request.Request(
            url=f"{self.config.base_url}{path}",
            method=method,
            data=payload,
            headers=request_headers,
        )
        with request.urlopen(req) as response:
            content = response.read().decode("utf-8")
            data = json.loads(content) if content else {}
            return response.status, data, dict(response.headers.items())

    def _request_redirect(self, path: str, *, headers: dict[str, str] | None = None) -> tuple[int, str | None]:
        opener = request.build_opener(NoRedirectHandler)
        req = request.Request(
            url=f"{self.config.base_url}{path}",
            method="GET",
            headers=headers or {},
        )
        try:
            response = opener.open(req)
            return response.status, response.headers.get("Location")
        except error.HTTPError as exc:
            return exc.code, exc.headers.get("Location")

    def _auth_headers(self) -> dict[str, str]:
        if not self.token:
            raise RuntimeError("Auth token not initialized")
        return {"Authorization": f"Bearer {self.token}"}

    def check_health(self) -> dict[str, Any]:
        status, payload, headers = self._request_json("GET", "/health")
        if status != 200 or payload.get("status") != "ok":
            raise RuntimeError(f"Unexpected /health response: status={status} payload={payload}")
        return {"status_code": status, "request_id": headers.get("X-Request-ID")}

    def check_readiness(self) -> dict[str, Any]:
        status, payload, _ = self._request_json("GET", "/health/ready")
        if status != 200 or payload.get("status") != "ready":
            raise RuntimeError(f"Unexpected /health/ready response: status={status} payload={payload}")
        return payload

    def check_auth_login(self) -> dict[str, Any]:
        status, payload, _ = self._request_json(
            "POST",
            "/api/auth/login",
            body={"email": self.config.auth_email, "password": self.config.auth_password},
        )
        token = payload.get("access_token")
        if status != 200 or not token:
            raise RuntimeError(f"Auth login failed: status={status} payload={payload}")
        self.token = token
        return {"user_id": payload["user"]["id"], "email": payload["user"]["email"]}

    def check_auth_me(self) -> dict[str, Any]:
        status, payload, _ = self._request_json("GET", "/api/auth/me", headers=self._auth_headers())
        if status != 200 or payload.get("email") != self.config.auth_email:
            raise RuntimeError(f"/api/auth/me failed: status={status} payload={payload}")
        return {"id": payload["id"], "email": payload["email"]}

    def check_products_list(self) -> dict[str, Any]:
        status, payload, _ = self._request_json("GET", "/api/products?page=1&pageSize=1")
        if status != 200 or "data" not in payload or "meta" not in payload:
            raise RuntimeError(f"/api/products failed: status={status} payload={payload}")
        if payload["meta"]["total"] < 1:
            raise RuntimeError("No products returned by /api/products")
        return payload["meta"]

    def check_product_detail(self) -> dict[str, Any]:
        status, payload, _ = self._request_json("GET", f"/api/products/{self.config.product_id}")
        if status != 200 or payload.get("id") != self.config.product_id:
            raise RuntimeError(f"Product detail failed: status={status} payload={payload}")
        return {"id": payload["id"], "slug": payload["slug"]}

    def check_redirect_tracking(self) -> dict[str, Any]:
        status, location = self._request_redirect(
            f"/api/redirect/{self.config.offer_id}?source=post-deploy-smoke",
            headers=self._auth_headers(),
        )
        if status not in {302, 307, 308} or not location:
            raise RuntimeError(f"Redirect failed: status={status} location={location}")
        return {"status_code": status, "location": location}

    def check_anonymous_sync(self) -> dict[str, Any]:
        status, payload, _ = self._request_json(
            "POST",
            "/api/sync/anonymous",
            headers=self._auth_headers(),
            body={
                "anonymous_session_id": "post-deploy-smoke",
                "favorites": [{"product_id": self.config.product_id}],
                "compare_list": [
                    {
                        "product_id": self.config.product_id,
                        "offer_id": self.config.offer_id,
                        "quantity": 1,
                    }
                ],
                "price_watches": [
                    {
                        "product_id": self.config.product_id,
                        "is_active": True,
                        "last_known_price": 4399.0,
                        "target_price": 4299.0,
                        "notify_on_price_drop": True,
                        "notify_on_new_best_offer": True,
                    }
                ],
            },
        )
        if status != 200:
            raise RuntimeError(f"Anonymous sync failed: status={status} payload={payload}")
        return {
            "favorites": len(payload.get("favorites", [])),
            "compare_list": len(payload.get("compare_list", [])),
            "price_watches": len(payload.get("price_watches", [])),
        }

    def check_dev_alert_evaluation(self) -> dict[str, Any]:
        status, payload, _ = self._request_json("POST", "/api/dev/evaluate-alerts")
        if status != 200 or "evaluated" not in payload:
            raise RuntimeError(f"Dev alert evaluation failed: status={status} payload={payload}")
        return {"evaluated": payload["evaluated"], "triggered": payload["triggered"]}

    def check_admin_analytics(self) -> dict[str, Any]:
        status, payload, _ = self._request_json("GET", "/api/admin/analytics/clicks?periodDays=30")
        if status != 200 or "total_clicks" not in payload:
            raise RuntimeError(f"Admin analytics failed: status={status} payload={payload}")
        return {"total_clicks": payload["total_clicks"]}

    def check_admin_operations(self) -> dict[str, Any]:
        status, payload, _ = self._request_json("GET", "/api/admin/operations/summary")
        if status != 200 or "runtime" not in payload or "persistent" not in payload:
            raise RuntimeError(f"Admin operations failed: status={status} payload={payload}")
        return {
            "api_requests": payload["runtime"]["requests"]["api"],
            "total_sync_runs": payload["persistent"]["total_sync_runs"],
        }


def build_config() -> SmokeConfig:
    base_url = os.getenv("SMOKE_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
    auth_email = os.getenv("SMOKE_AUTH_EMAIL", "user@linkshop.dev")
    auth_password = os.getenv("SMOKE_AUTH_PASSWORD", "123456")
    product_id = os.getenv("SMOKE_PRODUCT_ID", "product-iphone-15-128")
    offer_id = os.getenv("SMOKE_OFFER_ID", "offer-iphone-mercado-livre")
    include_dev_endpoints = os.getenv("SMOKE_INCLUDE_DEV_ENDPOINTS", "false").lower() == "true"

    return SmokeConfig(
        base_url=base_url,
        auth_email=auth_email,
        auth_password=auth_password,
        product_id=product_id,
        offer_id=offer_id,
        include_dev_endpoints=include_dev_endpoints,
    )


if __name__ == "__main__":
    sys.exit(SmokeRunner(build_config()).run())
