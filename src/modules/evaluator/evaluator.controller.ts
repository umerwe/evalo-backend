import { Response } from "express";
import { AuthRequest } from "../../types";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import {
    createEvaluation,
    fetchDashboard,
    fetchEvaluatedVideos,
    fetchVideos,
} from "./evaluator.service";

export const dashboard = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const data = await fetchDashboard(req.user);

        return res
            .status(201)
            .json(new ApiResponse(true, "Dashboard data fetched successfully", data));
    }
);

export const videos = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await fetchVideos(req.user?.id, req.query);

    return res
        .status(201)
        .json(new ApiResponse(true, "Videos Fetched Successfully", data));
});

export const evaluate = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const evaluation = await createEvaluation(req.user?._id, req.body);

        return res
            .status(201)
            .json(new ApiResponse(true, "Evaluation Created Successfully", evaluation));
    }
);

export const evaluatedVideos = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const data = await fetchEvaluatedVideos(req.user?.id, req.query);

        return res.status(200).json(
            new ApiResponse(true, "Evaluated Videos Fetched Successfully", data)
        );
    }
);
