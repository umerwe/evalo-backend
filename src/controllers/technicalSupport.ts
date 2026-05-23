import { Request, Response } from "express";
import { TechnicalSupport } from "../models/TechnicalSupport";
import { User } from "../models/User";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Types } from "mongoose";
import { AuthRequest } from "../types";

/* ====== TEAM CONTROLLERS ====== */

// Team sends message to admin
export const teamSendMessage = asyncHandler(async (req: Request, res: Response) => {
    const { teamId, message } = req.body;
    if (!teamId || !message) throw new ApiError(400, "teamId and message are required");

    const admin = await User.findOne({ userType: "admin" });
    if (!admin) throw new ApiError(500, "Admin not found");

    const conversationId = `${teamId}_${admin._id}`;

    // Check if conversation already exists
    let conversation = await TechnicalSupport.findOne({ conversationId });

    if (conversation) {
        conversation.messages.push({
            senderId: teamId,
            senderType: "team_member",
            message,
            isRead: false,
            timestamp: new Date(),
        });
        await conversation.save();
    } else {
        conversation = await TechnicalSupport.create({
            conversationId,
            teamId,
            adminId: admin._id,
            messages: [
                {
                    senderId: teamId,
                    senderType: "team_member",
                    message,
                    isRead: false,
                    timestamp: new Date(),
                },
            ],
        });
    }

    res.status(200).json(new ApiResponse(true, "Message sent successfully", conversation));
});

// Team fetches conversation messages by conversationId
export const getTeamMessages = asyncHandler(async (req: Request, res: Response) => {
    const { teamId } = req.params;
    
    const admin = await User.findOne({ userType: "admin" });
    if (!admin) throw new ApiError(404, "Admin not found");

    const conversationId = `${teamId}_${admin._id}`;

    const conversation = await TechnicalSupport.findOne({ conversationId });
    if (!conversation) throw new ApiError(404, "Conversation not found");

    res.status(200).json(new ApiResponse(true, "Messages fetched successfully", conversation.messages));
});

/* ====== ADMIN CONTROLLERS ====== */

// Admin gets all conversations
export const getAdminConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.user?._id;

    const conversations = await TechnicalSupport.find({ adminId })
        .populate("teamId", "teamName _id");

    if (!conversations) throw new ApiError(404, "Conversations not found");

    const data = conversations.map((conversation: any) => {
        // Count unread messages for the admin (messages sent by team members that are not read)
        const unreadCount = conversation.messages.filter(
            (msg: any) => msg.senderType === "team_member" && !msg.isRead
        ).length;

        return {
            conversationId: conversation.conversationId,
            teamId: conversation.teamId._id,
            teamName: conversation.teamId.teamName,
            unreadCount, // 👈 added unread count for admin
            lastMessage: conversation.messages[conversation.messages.length - 1].timestamp,
        };
    });

    res.status(200).json(new ApiResponse(true, "Conversations fetched successfully", data));
});

// Admin fetches messages of a specific conversation

export const getAdminMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { conversationId } = req.params;

    // Find conversation
    const conversation = await TechnicalSupport.findOne({ conversationId })
        .populate("teamId", "teamName _id");

    if (!conversation) {
        return res.status(404).json(new ApiResponse(false, "Conversation not found"));
    }

    // 🔹 Mark all unread messages from team_member as read
    let updated = false;
    conversation.messages.forEach((msg) => {
        if (msg.senderType === "team_member" && !msg.isRead) {
            msg.isRead = true;
            updated = true;
        }
    });

    // Save changes only if updates were made
    if (updated) await conversation.save();

    // Prepare response
    const team = conversation.teamId as any;
    const teamName = team?.teamName;
    const teamId = team?._id;

    res.status(200).json(
        new ApiResponse(true, "Messages fetched successfully", {
            messages: conversation.messages,
            teamId,
            teamName,
        })
    );
});

// Admin sends message to a team
export const adminSendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId, message } = req.body;
    if (!teamId || !message) throw new ApiError(400, "teamId and message are required");

    const adminId = new Types.ObjectId(req?.user?._id as string);
    const conversationId = `${teamId}_${adminId}`;

    // Check if conversation exists
    let conversation = await TechnicalSupport.findOne({ conversationId });

    if (conversation) {
        conversation.messages.push({
            senderId: adminId,
            senderType: "technical_team",
            message,
            isRead: false,
            timestamp: new Date(),
        });
        await conversation.save();
    } else {
        conversation = await TechnicalSupport.create({
            conversationId,
            teamId,
            adminId,
            messages: [
                {
                    senderId: adminId,
                    senderType: "technical_team",
                    message,
                    isRead: false,
                    timestamp: new Date(),
                },
            ],
        });
    }

    res.status(200).json(new ApiResponse(true, "Message sent successfully", conversation));
});

export const getAdminUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user?._id;
  if (!adminId) throw new ApiError(401, "Unauthorized");

  // Fetch all conversations for the admin
  const conversations = await TechnicalSupport.find({ adminId });

  // Count total unread messages (sent by team members)
  const totalUnread = conversations.reduce((count, conversation) => {
    const unreadInConversation = conversation.messages.filter(
      (msg: any) => msg.senderType === "team_member" && !msg.isRead
    ).length;
    return count + unreadInConversation;
  }, 0);

  res
    .status(200)
    .json(new ApiResponse(true, "Unread count fetched successfully", { totalUnread }));
});

