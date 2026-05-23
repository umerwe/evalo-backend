import { Response } from "express";
import { generatePresignedUrl, deleteFromS3 } from "../services/s3.service";
import { PendingUpload } from "../models/PendingUpload";
import { AuthRequest } from "../types";

const allowedFolders = ["images", "videos", "docs"] as const;
type Folder = typeof allowedFolders[number];

const mimeMap: Record<Folder, string[]> = {
  images: ["image/png", "image/jpeg", "image/webp"],
  videos: ["video/mp4", "video/avi", "video/quicktime", "video/webm"],
  docs: ["application/pdf"],
};

export const getUploadUrlHandler = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { fileName, fileType, folder } = req.body;

    if (!fileName || !fileType || !folder) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({ message: "Invalid folder" });
    }

    if (!mimeMap[folder as Folder].includes(fileType)) {
      return res.status(400).json({ message: "Invalid file type for folder" });
    }

    const data = await generatePresignedUrl(fileName, fileType, folder);

    // Track this pending upload (for cron cleanup later)
    await PendingUpload.create({
      userId,
      fileKey: data.fileKey,
      folder,
    });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const deleteFileHandler = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { fileKey } = req.body;

    if (!fileKey) {
      return res.status(400).json({ message: "fileKey required" });
    }

    // Safety: only allow deleting files in uploads/ folder
    if (!fileKey.startsWith("uploads/")) {
      return res.status(400).json({ message: "Invalid file key" });
    }

    // Safety: verify this user owns the pending upload
    const pending = await PendingUpload.findOne({ fileKey, userId });
    if (!pending) {
      return res.status(403).json({ message: "Not authorized to delete this file" });
    }

    // Delete from S3 and DB
    await deleteFromS3(fileKey).catch(() => {});
    await PendingUpload.deleteOne({ _id: pending._id });

    res.status(200).json({ message: "File deleted" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};