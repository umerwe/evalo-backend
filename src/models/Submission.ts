import { Schema, model, Document, Types } from "mongoose";

export interface ISubmission extends Document {
  teamId: Types.ObjectId;
  videoDetails: {
    videoLink: string;
    thumbnail: string;
    title: string;
    description: string;
    topic: string;
    learningOutcomes: string;
    duration: string;
    platform: string;
  };
  submissionStatus: "draft" | "submitted" | "under_review" | "evaluated";
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    videoDetails: {
      videoLink: { type: String, required: true },
      thumbnail: { type: String, required: true },
      title: { type: String, required: true },
      description: String,
      topic: { type: String, required: true },
      learningOutcomes: { type: String, required: true },
      duration: { type: String, required: true },
      platform: { type: String, default: "cloudinary" },
    },
    submissionStatus: {
      type: String,
      enum: ["draft", "submitted", "under_review", "evaluated"],
      default: "draft",
    },
  },
  { timestamps: true }
);

export const Submission = model<ISubmission>("Submission", SubmissionSchema);
