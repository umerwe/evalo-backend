import { Schema, model, Document, Types } from "mongoose";

export interface IEvaluatorAssignment extends Document {
  submissionId: Types.ObjectId;
  assignedEvaluators: {
    evaluatorId: Types.ObjectId;
    assignedAt: Date;
    evaluationStatus: "pending" | "completed";
    totalScore?: number;
  }[];
  totalEvaluators: number;
  completedEvaluations: number;
  averageScore?: number;
}

const EvaluatorAssignmentSchema = new Schema<IEvaluatorAssignment>(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
    },
    assignedEvaluators: [
      {
        evaluatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        assignedAt: { type: Date, default: Date.now },
        evaluationStatus: { type: String, enum: ["pending", "completed"], default: "pending" },
        totalScore: { type: Number, default: null },
      },
    ],
    totalEvaluators: { type: Number, default: 3 },
    completedEvaluations: { type: Number, default: 0 },
    averageScore: { type: Number, default: null },
  },
  { timestamps: true }
);

export const EvaluatorAssignment = model<IEvaluatorAssignment>(
  "EvaluatorAssignment",
  EvaluatorAssignmentSchema
);
