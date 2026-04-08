import type { AuthSession } from "@/features/auth/types/auth.types";
import { safeUUID } from "@/shared/lib/uuid";

export const ANONYMOUS_OWNER_ID = "guest-local";
const ANONYMOUS_SESSION_KEY = "linkshop-anonymous-session-id";

export function getPreferenceOwnerId(session?: AuthSession | null) {
  return session?.user.id ?? ANONYMOUS_OWNER_ID;
}

export function getAnonymousSessionId() {
  if (typeof window === "undefined") {
    return ANONYMOUS_OWNER_ID;
  }

  const existing = window.localStorage.getItem(ANONYMOUS_SESSION_KEY);

  if (existing) {
    return existing;
  }

  const created = safeUUID();
  window.localStorage.setItem(ANONYMOUS_SESSION_KEY, created);
  return created;
}
