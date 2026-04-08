export type ApiMeta = {
  requestId: string;
  timestamp: string;
  source: "mock" | "backend";
};

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta: ApiMeta;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
  meta: ApiMeta;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
};
