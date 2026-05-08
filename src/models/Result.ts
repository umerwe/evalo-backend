import { Schema, model, Document, Types } from "mongoose";

export interface IResult extends Document {
  finalScore: {
    evaluator1Score: number;
    evaluator2Score: number;
    evaluator3Score: number;
    averageScore: number;
    totalPossibleScore: number;
  };
  ranking: number;
  detailedScores: {
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
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    finalScore: {
      evaluator1Score: Number,
      evaluator2Score: Number,
      evaluator3Score: Number,
      averageScore: Number,
      totalPossibleScore: { type: Number, default: 100 },
    },
    ranking: Number,
    detailedScores: {
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
    isPublished: { type: Boolean, default: false },
    publishedAt: Date,
  },
  { timestamps: true }
);

export const Result = model<IResult>("Result", ResultSchema);
