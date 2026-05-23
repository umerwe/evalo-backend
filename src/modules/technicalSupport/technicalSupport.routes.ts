import { Router } from "express";
import {
    teamSendMessage,
    getTeamMessages,
    getAdminConversations,
    getAdminMessages,
    adminSendMessage,
    getAdminUnreadCount
} from "./technicalSupport.controller";
import { createRoleBasedJWTMiddleware } from "../../middlewares/getUser";

const router = Router();

/* ====== TEAM ROUTES ====== */
router.post("/team/send", teamSendMessage);
router.get("/team/messages/:teamId", getTeamMessages);

/* ====== ADMIN ROUTES ====== */
router.get("/admin/conversations",createRoleBasedJWTMiddleware(), getAdminConversations); // list of all conversations with team info
router.get("/admin/messages/:conversationId", createRoleBasedJWTMiddleware(), getAdminMessages); // fetch messages for a specific conversation
router.post("/admin/send", createRoleBasedJWTMiddleware(), adminSendMessage);
router.get("/admin/unread-count", createRoleBasedJWTMiddleware(), getAdminUnreadCount);

export default router;
