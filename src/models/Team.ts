import { Schema, model, Document, Types } from "mongoose"

export interface ITeam extends Document {
  teamName: string
  teamLeadId: Types.ObjectId
  members: Types.ObjectId[]
  totalMembers: number
  maxMembers: number
  status: "not-submitted" | "submitted"
  createdAt: Date
  updatedAt: Date
}

const TeamSchema = new Schema<ITeam>(
  {
    teamName: { type: String, required: true, unique: true },
    teamLeadId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    totalMembers: { type: Number, default: 0 },
    maxMembers: { type: Number, default: 5 },
    status: {
      type: String,
      enum: ["not-submitted", "submitted"],
      default: "not-submitted",
    },
  },
  { timestamps: true }
)

export const Team = model<ITeam>("Team", TeamSchema)
