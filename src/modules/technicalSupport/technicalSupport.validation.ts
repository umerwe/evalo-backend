import { z } from "zod";

export const sendTeamMessageSchema = z.object({
  body: z.object({
    teamId: z.string().min(1, "teamId is required"),
    message: z.string().min(1, "message is required"),
  }),
});

export const getTeamMessagesSchema = z.object({
  params: z.object({
    teamId: z.string().min(1, "teamId is required"),
  }),
});

export const getAdminMessagesSchema = z.object({
  params: z.object({
    conversationId: z.string().min(1, "conversationId is required"),
  }),
});

export const sendAdminMessageSchema = z.object({
  body: z.object({
    teamId: z.string().min(1, "teamId is required"),
    message: z.string().min(1, "message is required"),
  }),
});