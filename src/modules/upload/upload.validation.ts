import { z } from "zod";

export const getUploadUrlSchema = z.object({
    body: z.object({
        fileName: z.string().min(1, "fileName is required"),
        fileType: z.string().min(1, "fileType is required"),
        folder: z.string().min(1, "folder is required"),
    }),
});

export const deleteFileSchema = z.object({
    body: z.object({
        fileKey: z.string().min(1, "fileKey required"),
    }),
});
