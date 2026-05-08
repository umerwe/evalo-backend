import { Request, Response } from "express";
import { Result } from "../models/Result";
import { asyncHandler } from "../utils/asyncHandler";

export const setResultStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body; // "true" or "false"

    // Convert string to boolean EXACTLY as sent
    const isPublished = status === "true";

    // Find the single result document
    let result = await Result.findOne();

    if (!result) {
        // Create new if it does not exist
        result = await Result.create({
            isPublished
        });
    } else {
        // Update existing
        result.isPublished = isPublished;
        await result.save();
    }

    res.json({
        message: `Result is now ${isPublished ? "Published" : "Unpublished"}`,
        isPublished: result.isPublished
    });
});


export const getResult = asyncHandler(async (req: Request, res: Response) => {
    const result = await Result.findOne({ isPublished: true });

    if (!result) {
        return res.status(404).json({ isPublished: false });
    }

    res.json({isPublished: result.isPublished});
});

