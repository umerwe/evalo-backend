import { Schema, model, Document, Types } from "mongoose";

export interface IEvaluation extends Document {
  submissionId: Types.ObjectId;
  evaluatorId: Types.ObjectId;
  scores: {
    relevanceToLearningObjectives: number;
    innovationCreativity: number;
    clarityAccessibility: number;
    depth: number;
    interactivityEngagement: number;
    useOfTechnology: number;
    scalabilityAdaptability: number;
    alignmentEthicalStandards: number;
    practicalApplication: number;
    videoQuality: number;
  };
  totalScore: number;
  comment: {
    type : String
  };
  evaluationStatus: "pending" | "completed";
}

const EvaluationSchema = new Schema<IEvaluation>(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: "Submission", required: true },
    evaluatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    scores: {
      relevanceToLearningObjectives: Number,
      innovationCreativity: Number,
      clarityAccessibility: Number,
      depth: Number,
      interactivityEngagement: Number,
      useOfTechnology: Number,
      scalabilityAdaptability: Number,
      alignmentEthicalStandards: Number,
      practicalApplication: Number,
      videoQuality: Number,
    },
    totalScore: {
      type: Number,
      required: true
    },
    comment: {
      type : String
    },
    evaluationStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export const Evaluation = model<IEvaluation>("Evaluation", EvaluationSchema);
