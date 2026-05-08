import mongoose, { Schema, Document } from "mongoose";

export interface IRecentActivity extends Document {
  title: string;
  createdAt: Date;
}

const recentActivitySchema = new Schema<IRecentActivity>({
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const RecentActivity = mongoose.model<IRecentActivity>("RecentActivity", recentActivitySchema);
