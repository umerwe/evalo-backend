import { z } from "zod";

export const registerSchema = z.object({
    body: z.object({}).passthrough(),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().min(1, "email is required"),
        password: z.string().min(1, "password is required"),
        userType: z.string().min(1, "userType is required"),
    }),
});

export const allUsersSchema = z.object({
    query: z.object({
        userType: z.string().optional(),
        id: z.string().optional(),
    }),
});
