import { Router } from "express";
import {
    sendTeamMessage,
    getTeamMessages,
    getAdminConversations,
    getAdminMessages,
    sendAdminMessage,
    getAdminUnreadCount
} from "./technicalSupport.controller";
import { createRoleBasedJWTMiddleware } from "../../middlewares/getUser.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
    sendTeamMessageSchema,
    getTeamMessagesSchema,
    getAdminMessagesSchema,
    sendAdminMessageSchema,
} from "./technicalSupport.validation";

const router = Router();

/* ====== TEAM ROUTES ====== */
router.post("/team/send", createRoleBasedJWTMiddleware(), validate(sendTeamMessageSchema), sendTeamMessage);
router.get("/team/messages/:teamId", createRoleBasedJWTMiddleware(), validate(getTeamMessagesSchema), getTeamMessages);

/* ====== ADMIN ROUTES ====== */
router.get("/admin/conversations", createRoleBasedJWTMiddleware(), getAdminConversations);
router.get("/admin/messages/:conversationId", createRoleBasedJWTMiddleware(), validate(getAdminMessagesSchema), getAdminMessages);
router.post("/admin/send", createRoleBasedJWTMiddleware(), validate(sendAdminMessageSchema), sendAdminMessage);
router.get("/admin/unread-count", createRoleBasedJWTMiddleware(), getAdminUnreadCount);

export default router;