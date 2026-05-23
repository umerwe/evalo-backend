import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/s3.config";
import { randomUUID } from "crypto";
import { config } from "../config/env";

export const generatePresignedUrl = async (
  fileName: string,
  fileType: string,
  folder: "images" | "videos" | "docs"
) => {
  const ext = fileName.split(".").pop();
  const fileKey = `uploads/${folder}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: config.awsBucketName,
    Key: fileKey,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return { uploadUrl, fileKey };
};

export const deleteFromS3 = async (fileKey: string) => {
  const command = new DeleteObjectCommand({
    Bucket: config.awsBucketName,
    Key: fileKey,
  });
  return s3Client.send(command);
};