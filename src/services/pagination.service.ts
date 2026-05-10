export type PaginationQuery = {
    page?: string | number;
    limit?: string | number;
};

export type PaginationParams = {
    page: number;
    limit: number;
    skip: number;
};

export type PaginationMeta = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

const toPositiveInt = (value: unknown, fallback: number): number => {
    const parsed = parseInt(String(value), 10);
    if (!Number.isFinite(parsed) || parsed < 1) return fallback;
    return parsed;
};

export const getPaginationParams = (
    query: PaginationQuery,
    defaults: { page?: number; limit?: number } = {}
): PaginationParams => {
    const page = toPositiveInt(query.page, defaults.page ?? 1);
    const limit = toPositiveInt(query.limit, defaults.limit ?? 10);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

export const buildPaginationMeta = (
    total: number,
    page: number,
    limit: number
): PaginationMeta => ({
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
});
