/** Synced from dwelis-frontend/app/utils/pagination.ts */
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore?: boolean;
};

export function normalizePaginated<T>(data: unknown, fallbackLimit = 20): PaginatedResponse<T> {
  if (Array.isArray(data)) {
    return {
      items: data as T[],
      total: data.length,
      page: 1,
      limit: data.length || fallbackLimit,
      hasMore: false,
    };
  }
  const d = data as PaginatedResponse<T> | null | undefined;
  const items = Array.isArray(d?.items) ? d.items : [];
  const page = d?.page ?? 1;
  const limit = d?.limit ?? fallbackLimit;
  const total = d?.total ?? items.length;
  return {
    items,
    total,
    page,
    limit,
    hasMore: d?.hasMore ?? page * limit < total,
  };
}
