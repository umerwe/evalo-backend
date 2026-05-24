import { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthRequest } from "../../types";
import { createAdminMessage, createTeamMessage, fetchAdminConversations, fetchAdminMessages, fetchAdminUnreadCount, fetchTeamMessages } from "./technicalSupport.service";

export const sendTeamMessage = asyncHandler(async (req: Request, res: Response) => {
    const { teamId, message } = req.body;
    
    const conversation = await createTeamMessage(teamId, message);

    res.status(200).json(new ApiResponse(true, "Message sent successfully", conversation));
});

export const getTeamMessages = asyncHandler(async (req: Request, res: Response) => {
    const { teamId } = req.params;
    
    const conversation = await fetchTeamMessages(teamId);

    res.status(200).json(new ApiResponse(true, "Messages fetched successfully", conversation.messages));
});

export const getAdminConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.user?._id as string;

    const conversations = await fetchAdminConversations(adminId);

    res.status(200).json(new ApiResponse(true, "Conversations fetched successfully", conversations));
});

export const getAdminMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { conversationId } = req.params;
    
    const { messages, teamId, teamName } = await fetchAdminMessages(conversationId);

    res.status(200).json(
        new ApiResponse(true, "Messages fetched successfully", {
            messages,
            teamId,
            teamName,
        })
    );
});

export const sendAdminMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId, message } = req.body;
    
    const adminId = req?.user?._id as string;
    const conversationId = `${teamId}_${adminId}`;

    const conversation = await createAdminMessage(conversationId, message, adminId, teamId);

    res.status(200).json(new ApiResponse(true, "Message sent successfully", conversation));
});

export const getAdminUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.user?._id as string;

    const { totalUnread } = await fetchAdminUnreadCount(adminId)

    res
        .status(200)
        .json(new ApiResponse(true, "Unread count fetched successfully", { totalUnread }));
});

