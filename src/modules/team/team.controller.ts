import { Response } from "express";
import { AuthRequest } from "../../types";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import {
    createVideoSubmission,
    fetchDashboard,
    fetchDetailedResult,
    fetchEvaluatorFeedback,
    fetchResult,
    fetchTeam,
} from "./team.service";

export const dashboard = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?._id;
        const data = await fetchDashboard(userId);

        return res
            .status(200)
            .json(new ApiResponse(true, "Dashboard fetched successfully", data));
    }
);

export const submitVideo = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?._id;
        const submission = await createVideoSubmission(userId, req.body);

        return res
            .status(201)
            .json(new ApiResponse(true, "Video submitted successfully", submission));
    }
);

export const getTeam = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?._id;
        const team = await fetchTeam(userId);

        return res
            .status(200)
            .json(new ApiResponse(true, "Team fetched successfully", team));
    }
);

export const evaluatorFeedback = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?._id;
        const evaluation = await fetchEvaluatorFeedback(userId);

        return res
            .status(200)
            .json(new ApiResponse(true, "Team fetched successfully", evaluation));
    }
);

export const result = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?._id;
        const resultData = await fetchResult(userId);

        return res
            .status(200)
            .json(new ApiResponse(true, "Result fetched successfully", resultData));
    }
);

export const detailedResult = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?._id;
        const detailedResult = await fetchDetailedResult(userId);

        return res
            .status(200)
            .json(new ApiResponse(true, "Video Fetched successfully", detailedResult));
    }
);
