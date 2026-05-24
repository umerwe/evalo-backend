import { z } from "zod";

export const paramsIdSchema = z.object({
    params: z.object({
        id: z.string().min(1, "id is required"),
    }),
});

export const leaderboardSchema = z.object({
    query: z.object({
        topic: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
    }),
});

export const paginationSchema = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
    }),
});
