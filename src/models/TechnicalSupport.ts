import { Schema, model, Document, Types } from "mongoose";

export interface IMessage {
  senderId: Types.ObjectId;
  senderType: "team_member" | "technical_team";
  message: string;
  isRead: boolean;
  timestamp: Date;
}

export interface ITechnicalSupport extends Document {
  conversationId: string; // unique per team ↔ admin
  teamId: Types.ObjectId; // team sending messages
  adminId: Types.ObjectId; // admin receiving messages
  messages: IMessage[]; // all chat messages
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderType: { type: String, enum: ["team_member", "technical_team"], required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TechnicalSupportSchema = new Schema<ITechnicalSupport>(
  {
    conversationId: { type: String, required: true, unique: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    messages: [MessageSchema],
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export const TechnicalSupport = model<ITechnicalSupport>("TechnicalSupport", TechnicalSupportSchema);
