import { Response } from "express";
import { AuthRequest } from "../../types";
import { createUploadUrl, deleteUploadedFile } from "./upload.service";

export const getUploadUrlHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { statusCode, data } = await createUploadUrl(userId, req.body);

        return res.status(statusCode).json(data);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error });
    }
};

export const deleteFileHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { statusCode, data } = await deleteUploadedFile(userId, req.body);

        return res.status(statusCode).json(data);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error });
    }
};
