import { TechnicalSupport } from "@/models/TechnicalSupport";
import { User } from "@/models/User";
import { ApiError } from "@/utils/ApiError";
import { Types } from "mongoose";

export const createTeamMessage = async (teamId: string, message: string) => {
    const admin = await User.findOne({ userType: "admin" });
    if (!admin) throw new ApiError(500, "Admin not found");

    const conversationId = `${teamId}_${admin._id}`;
    const teamObjectId = new Types.ObjectId(teamId);

    let conversation = await TechnicalSupport.findOne({ conversationId });

    if (conversation) {
        conversation.messages.push({
            senderId: teamObjectId,
            senderType: "team_member",
            message,
            isRead: false,
            timestamp: new Date(),
        });
        await conversation.save();
    } else {
        conversation = await TechnicalSupport.create({
            conversationId,
            teamId: teamObjectId,
            adminId: admin._id,
            messages: [{ senderId: teamObjectId, senderType: "team_member", message, isRead: false, timestamp: new Date() }],
        });
    }
    return conversation;
};

export const fetchTeamMessages = async (teamId: string) => {
    const admin = await User.findOne({ userType: "admin" });
    if (!admin) throw new ApiError(404, "Admin not found");

    const conversationId = `${teamId}_${admin._id}`;

    const conversation = await TechnicalSupport.findOne({ conversationId });
    if (!conversation) throw new ApiError(404, "Conversation not found");
    return conversation;

}

export const fetchAdminConversations = async (adminId: string) => {
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
    return data;
}

export const fetchAdminMessages = async (conversationId: string) => {
    const conversation = await TechnicalSupport.findOne({ conversationId })
        .populate("teamId", "teamName _id");

    if (!conversation) throw new ApiError(404, "Conversation not found");

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

    return {
        messages: conversation.messages,
        teamId,
        teamName,
    }
}

export const createAdminMessage = async (conversationId: string, message: string, adminId: string, teamId: string) => {
    let conversation = await TechnicalSupport.findOne({ conversationId });
    const adminObjectId = new Types.ObjectId(adminId);
    const teamObjectId = new Types.ObjectId(teamId);

    if (conversation) {
        conversation.messages.push({
            senderId: adminObjectId,
            senderType: "technical_team",
            message,
            isRead: false,
            timestamp: new Date(),
        });
        await conversation.save();
    } else {
        conversation = await TechnicalSupport.create({
            conversationId,
            teamId: teamObjectId,
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
}

export const fetchAdminUnreadCount = async (adminId: string) => {
    const conversations = await TechnicalSupport.find({ adminId });

    const totalUnread = conversations.reduce((count, conversation) => {
        const unreadInConversation = conversation.messages.filter(
            (msg: any) => msg.senderType === "team_member" && !msg.isRead
        ).length;
        return count + unreadInConversation;
    }, 0);

    return { totalUnread };
}