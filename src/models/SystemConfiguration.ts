import { Schema, model, Document } from "mongoose";

export interface ISystemConfiguration extends Document {
  configType: "competition_settings" | "evaluation_criteria" | "deadlines";
  settings: {
    competitionName?: string;
    registrationDeadline?: Date;
    submissionDeadline?: Date;
    evaluationDeadline?: Date;
    resultsAnnouncementDate?: Date;
    maxVideoLength?: number;
    maxTeamSize?: number;
    requiredEvaluators?: number;
    isRegistrationOpen?: boolean;
    isSubmissionOpen?: boolean;
    isEvaluationOpen?: boolean;
    areResultsPublished?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SystemConfigurationSchema = new Schema<ISystemConfiguration>(
  {
    configType: {
      type: String,
      enum: ["competition_settings", "evaluation_criteria", "deadlines"],
      required: true,
    },
    settings: {
      competitionName: String,
      registrationDeadline: Date,
      submissionDeadline: Date,
      evaluationDeadline: Date,
      resultsAnnouncementDate: Date,
      maxVideoLength: Number,
      maxTeamSize: Number,
      requiredEvaluators: Number,
      isRegistrationOpen: Boolean,
      isSubmissionOpen: Boolean,
      isEvaluationOpen: Boolean,
      areResultsPublished: Boolean,
    },
  },
  { timestamps: true }
);

export const SystemConfiguration = model<ISystemConfiguration>("SystemConfiguration", SystemConfigurationSchema);
