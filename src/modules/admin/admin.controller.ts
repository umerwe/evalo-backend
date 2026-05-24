import { Request, Response } from "express";
import {
    fetchAssignedEvaluators,
    fetchDashboard,
    fetchEvaluatorDetails,
    fetchEvaluatorList,
    fetchLeaderboard,
    fetchRecentActivities,
    fetchResult,
    fetchTeamDetails,
    fetchTeamList,
    fetchTeamUser,
    fetchVideoDetails,
    fetchVideos,
    removeVideo,
    toggleEvaluatorAssignment,
} from "./admin.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

export const dashboard = asyncHandler(async (req: Request, res: Response) => {
    const data = await fetchDashboard();

    return res
        .status(200)
        .json(new ApiResponse(true, "Dashboard fetched successfully", data));
});

export const evaluatorList = asyncHandler(
    async (req: Request, res: Response) => {
        const data = await fetchEvaluatorList(req.query);

        return res
            .status(200)
            .json(new ApiResponse(true, "Evaluators Fetched successfully", data));
    }
);

export const evaluatorDetails = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const evaluator = await fetchEvaluatorDetails(id);

        return res
            .status(200)
            .json(new ApiResponse(true, "Evaluator Fetched successfully", evaluator));
    }
);

export const assignEvaluator = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const { evaluator, message } = await toggleEvaluatorAssignment(id);

        return res.status(200).json(new ApiResponse(true, message, evaluator));
    }
);

export const assignedEvaluators = asyncHandler(
    async (req: Request, res: Response) => {
        const evaluators = await fetchAssignedEvaluators();

        return res
            .status(200)
            .json(new ApiResponse(true, "Evaluators Fetched successfully", evaluators));
    }
);

export const teamList = asyncHandler(async (req: Request, res: Response) => {
    const data = await fetchTeamList(req.query);

    return res
        .status(200)
        .json(new ApiResponse(true, "Teams fetched successfully", data));
});

export const teamDetails = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const team = await fetchTeamDetails(id);

        return res
            .status(200)
            .json(new ApiResponse(true, "Team Fetched successfully", team));
    }
);

export const teamUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const team = await fetchTeamUser(id);

    return res
        .status(200)
        .json(new ApiResponse(true, "Team Fetched successfully", team));
});

export const videos = asyncHandler(async (req: Request, res: Response) => {
    const data = await fetchVideos(req.query);

    return res
        .status(200)
        .json(new ApiResponse(true, "Videos fetched successfully", data));
});

export const videoDetails = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const video = await fetchVideoDetails(id);

        return res
            .status(200)
            .json(new ApiResponse(true, "Video Fetched successfully", video));
    }
);

export const deleteVideo = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        await removeVideo(id);

        return res
            .status(200)
            .json(new ApiResponse(true, "Video deleted successfully"));
    }
);

export const result = asyncHandler(async (req: Request, res: Response) => {
    const data = await fetchResult(req.query);

    return res
        .status(200)
        .json(new ApiResponse(true, "Result Fetched successfully", data));
});

export const leaderboard = asyncHandler(
    async (req: Request, res: Response) => {
        const data = await fetchLeaderboard(req.query);

        return res
            .status(200)
            .json(new ApiResponse(true, "Leaderboard Fetched successfully", data));
    }
);

export const recentActivities = asyncHandler(
    async (req: Request, res: Response) => {
        const recentActivity = await fetchRecentActivities();

        return res
            .status(200)
            .json(
                new ApiResponse(
                    true,
                    "Recent Activity Fetched successfully",
                    recentActivity
                )
            );
    }
);
