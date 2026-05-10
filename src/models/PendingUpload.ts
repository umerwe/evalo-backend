import { Schema, model, Document, Types } from "mongoose";

export interface IPendingUpload extends Document {
  userId: Types.ObjectId;
  fileKey: string;
  folder: string;
  createdAt: Date;
}

const PendingUploadSchema = new Schema<IPendingUpload>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileKey: { type: String, required: true, unique: true },
    folder: { type: String, required: true },
  },
  { timestamps: true }
);

export const PendingUpload = model<IPendingUpload>("PendingUpload", PendingUploadSchema);