import { PendingUpload } from "../../models/PendingUpload";
import { deleteFromS3, generatePresignedUrl } from "../../services/s3.service";

const allowedFolders = ["images", "videos", "docs"] as const;
type Folder = (typeof allowedFolders)[number];

const mimeMap: Record<Folder, string[]> = {
    images: ["image/png", "image/jpeg", "image/webp"],
    videos: ["video/mp4", "video/avi", "video/quicktime", "video/webm"],
    docs: ["application/pdf"],
};

export const createUploadUrl = async (userId: any, body: any) => {
    const { fileName, fileType, folder } = body;

    if (!fileName || !fileType || !folder) {
        return { statusCode: 400, data: { message: "Missing required fields" } };
    }

    if (!allowedFolders.includes(folder)) {
        return { statusCode: 400, data: { message: "Invalid folder" } };
    }

    if (!mimeMap[folder as Folder].includes(fileType)) {
        return {
            statusCode: 400,
            data: { message: "Invalid file type for folder" },
        };
    }

    const data = await generatePresignedUrl(fileName, fileType, folder);

    await PendingUpload.create({
        userId,
        fileKey: data.fileKey,
        folder,
    });

    return { statusCode: 200, data };
};

export const deleteUploadedFile = async (userId: any, body: any) => {
    const { fileKey } = body;

    if (!fileKey) {
        return { statusCode: 400, data: { message: "fileKey required" } };
    }

    if (!fileKey.startsWith("uploads/")) {
        return { statusCode: 400, data: { message: "Invalid file key" } };
    }

    const pending = await PendingUpload.findOne({ fileKey, userId });
    if (!pending) {
        return {
            statusCode: 403,
            data: { message: "Not authorized to delete this file" },
        };
    }

    await deleteFromS3(fileKey).catch(() => {});
    await PendingUpload.deleteOne({ _id: pending._id });

    return { statusCode: 200, data: { message: "File deleted" } };
};
