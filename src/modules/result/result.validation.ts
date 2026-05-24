import { z } from "zod";

export const setResultStatusSchema = z.object({
    body: z.object({
        status: z.string().min(1, "status is required"),
    }),
});
