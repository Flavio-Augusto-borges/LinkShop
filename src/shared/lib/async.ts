import type { ApiMeta, ApiResponse } from "@/shared/types/api.types";
import { safeUUID } from "@/shared/lib/uuid";

type MockRequestOptions = {
  delayMs?: number;
};

function createMeta(): ApiMeta {
  return {
    requestId: safeUUID(),
    timestamp: new Date().toISOString(),
    source: "mock"
  };
}

export async function mockSuccess<T>(
  data: T,
  options: MockRequestOptions = {}
): Promise<ApiResponse<T>> {
  const delayMs = options.delayMs ?? 120;
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  return {
    ok: true,
    data,
    meta: createMeta()
  };
}

export async function mockFailure<T>(
  code: string,
  message: string,
  options: MockRequestOptions = {}
): Promise<ApiResponse<T>> {
  const delayMs = options.delayMs ?? 120;
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  return {
    ok: false,
    error: {
      code,
      message
    },
    meta: createMeta()
  };
}
