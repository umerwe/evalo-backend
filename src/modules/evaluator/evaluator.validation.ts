import { z } from "zod";

export const evaluateSchema = z.object({
    body: z.object({
        submissionId: z.string().min(1, "submissionId is required"),
        relevanceToLearningObjectives: z.number(),
        innovationCreativity: z.number(),
        clarityAccessibility: z.number(),
        depth: z.number(),
        interactivityEngagement: z.number(),
        useOfTechnology: z.number(),
        scalabilityAdaptability: z.number(),
        alignmentEthicalStandards: z.number(),
        practicalApplication: z.number(),
        videoQuality: z.number(),
        comment: z.string().min(1, "comment is required"),
    }),
});

export const paginationSchema = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
    }),
});
