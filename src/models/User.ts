import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  userType: "admin" | "team_lead" | "team_member" | "evaluator";
  email: string;
  password: string;
  profile: {
    name: string;
    phone?: string;
    address?: string;
    qualification?: string;
    experience?: number;
    profileImage?: string;
  };
  isApproved?: boolean;
  isActive: boolean;
  evaluationStats?: {
    totalAssigned: number;
    totalCompleted: number;
    averageScore: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userType: { type: String, enum: ["admin", "team_lead", "team_member", "evaluator"], required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: {
      name: { type: String, required: true },
      phone: String,
      address: String,
      qualification: String,
      experience: String,
      profileImage: String,
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    evaluationStats: {
      totalAssigned: { type: Number, default: 0 },
      totalCompleted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

export const User = model<IUser>("User", UserSchema);
