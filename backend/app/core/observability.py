from __future__ import annotations

import time
from datetime import datetime, timezone
from threading import Lock
from typing import Any


class ObservabilityRegistry:
    def __init__(self) -> None:
        self._lock = Lock()
        self._started_at = time.monotonic()
        self._request_counters: dict[str, int] = {
            "total": 0,
            "api": 0,
            "failed": 0,
            "server_error": 0,
        }
        self._flow_counters: dict[str, dict[str, int]] = {}
        self._flow_last_error: dict[str, dict[str, Any]] = {}
        self._last_error: dict[str, Any] | None = None

    def record_request(self, *, path: str, status_code: int) -> None:
        with self._lock:
            self._request_counters["total"] += 1
            if path.startswith("/api"):
                self._request_counters["api"] += 1
            if status_code >= 400:
                self._request_counters["failed"] += 1
            if status_code >= 500:
                self._request_counters["server_error"] += 1

    def record_flow_request(self, flow: str, *, amount: int = 1) -> None:
        self._record_flow_counter(flow, "requests", amount)

    def record_flow_success(self, flow: str, *, amount: int = 1) -> None:
        self._record_flow_counter(flow, "successes", amount)

    def record_flow_metric(self, flow: str, metric: str, amount: int) -> None:
        self._record_flow_counter(flow, metric, amount)

    def record_flow_failure(
        self,
        flow: str,
        *,
        message: str,
        code: str | None = None,
        request_id: str | None = None,
        context: dict[str, Any] | None = None,
    ) -> None:
        error_entry = {
            "message": message,
            "code": code,
            "request_id": request_id,
            "occurred_at": datetime.now(timezone.utc),
            "context": context or None,
        }

        with self._lock:
            self._flow_counters.setdefault(flow, {})
            self._flow_counters[flow]["failures"] = self._flow_counters[flow].get("failures", 0) + 1
            self._flow_last_error[flow] = error_entry
            self._last_error = {"flow": flow, **error_entry}

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            flows: dict[str, dict[str, Any]] = {}
            for flow_name in sorted(self._flow_counters.keys()):
                flow_counters = dict(self._flow_counters[flow_name])
                flows[flow_name] = {
                    "metrics": flow_counters,
                    "last_error": self._flow_last_error.get(flow_name),
                }

            return {
                "generated_at": datetime.now(timezone.utc),
                "uptime_seconds": int(time.monotonic() - self._started_at),
                "requests": dict(self._request_counters),
                "flows": flows,
                "last_error": self._last_error,
            }

    def reset(self) -> None:
        with self._lock:
            self._started_at = time.monotonic()
            self._request_counters = {
                "total": 0,
                "api": 0,
                "failed": 0,
                "server_error": 0,
            }
            self._flow_counters = {}
            self._flow_last_error = {}
            self._last_error = None

    def _record_flow_counter(self, flow: str, metric: str, amount: int) -> None:
        if amount <= 0:
            return

        with self._lock:
            self._flow_counters.setdefault(flow, {})
            self._flow_counters[flow][metric] = self._flow_counters[flow].get(metric, 0) + amount


observability_registry = ObservabilityRegistry()
