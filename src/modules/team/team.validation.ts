import { z } from "zod";

export const submitVideoSchema = z.object({
    body: z.object({
        title: z.string().min(1, "title is required"),
        description: z.string().min(1, "description is required"),
        topic: z.string().min(1, "topic is required"),
        learningOutcomes: z.string().min(1, "learningOutcomes is required"),
        videoKey: z.string().min(1, "videoKey is required"),
        thumbnailKey: z.string().min(1, "thumbnailKey is required"),
        durationInSeconds: z.number(),
    }),
});
