import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/User";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { Team } from "../models/Team";
import { Submission } from "../models/Submission";
import { EvaluatorAssignment } from "../models/EvaluatorAssignment";
import { RecentActivity } from "../models/recentActivities";
import { Result } from "../models/Result";

export const dashboard = asyncHandler(async (req: Request, res: Response) => {
    const stats = {
        teams: await Team.countDocuments(),
        assignedEvaluators: await User.countDocuments({ isApproved: true }),
        totalVideos: await Submission.countDocuments(),
        totalEvaluations: await EvaluatorAssignment.countDocuments({ completedEvaluations: 3 }),
    };

    // Submission trend summary
    const totalSubmissions = await Submission.countDocuments();
    const completedEvaluations = await EvaluatorAssignment.countDocuments({ completedEvaluations: 3 });
    const pendingEvaluations = totalSubmissions - completedEvaluations;

    const recentActivities = await RecentActivity.find().sort({ createdAt: -1 }).limit(3);

    const submissionTrendData = [
        {
            name: "Submissions Created",
            value: totalSubmissions,
            color: "#3b82f6",
        },
        {
            name: "Submissions Completed",
            value: completedEvaluations,
            color: "#10b981",
        },
        {
            name: "Pending Evaluations",
            value: pendingEvaluations,
            color: "#f59e0b",
        }
    ];

    // Leaderboard
    let leaderboardData: any[] = [];
    const result = await Result.findOne({ isPublished: true });

    if (result) {
        // Get top 3 teams with completed evaluations
        const leaderboard = await EvaluatorAssignment.find({ completedEvaluations: 3 })
            .sort({ averageScore: -1 })
            .limit(3)
            .populate({
                path: "submissionId",
                populate: {
                    path: "teamId",
                    populate: { path: "teamLeadId" }
                }
            });

        leaderboardData = leaderboard.map((item: any) => {
            const team = item.submissionId.teamId;
            const teamLead = team?.teamLeadId;

            return {
                teamName: team?.teamName || "Unknown Team",
                averageScore: item.averageScore || 0,
                thumbnail: team?.thumbnail || "/default-thumbnail.png", // add default thumbnail
                teamLead: teamLead?.name || "N/A",
                topic: item.submissionId?.topic || "N/A",
            };
        });
    } else {
        leaderboardData = [];
    }


    return res.status(200).json(
        new ApiResponse(true, "Dashboard fetched successfully", {
            stats,
            evaluationStatus: { evaluatedVideos: completedEvaluations, pendingVideos: pendingEvaluations },
            leaderboardData,
            submissionTrendData,
            recentActivities
        })
    );
});

export const evaluatorList = asyncHandler(async (req: Request, res: Response) => {
    const evaluators = await User.find({ userType: "evaluator" });
    const total = evaluators.length;

    const approved = evaluators.filter((evaluator) => evaluator.isApproved === true).length;
    const pending = total - approved;

    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Evaluators Fetched successfully",
                {
                    evaluators,
                    total,
                    approved,
                    pending
                }));
});

export const evaluatorDetails = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const evaluator = await User.findOne({ _id: id, userType: "evaluator" });
    if (!evaluator) {
        throw new ApiError(404, "Evaluator not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Evaluator Fetched successfully",
                evaluator
            ));
});

export const assignEvaluator = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const evaluator = await User.findById(id);

    if (!evaluator) {
        throw new ApiError(404, "Evaluator not found");
    }

    // Ensure role is evaluator
    if (evaluator.userType !== "evaluator") {
        throw new ApiError(400, "User is not an evaluator");
    }

    // ✅ If trying to APPROVE (false → true), check limit
    if (!evaluator.isApproved) {
        const approvedEvaluatorsCount = await User.countDocuments({
            userType: "evaluator",
            isApproved: true
        });

        if (approvedEvaluatorsCount >= 3) {
            throw new ApiError(
                400,
                "Only 3 evaluators are allowed to be approved"
            );
        }
    }

    // Toggle approval
    evaluator.isApproved = !evaluator.isApproved;

    await evaluator.save();

    const message = evaluator.isApproved
        ? "Evaluator approved successfully"
        : "Evaluator approval revoked successfully";

    return res.status(200).json(
        new ApiResponse(true, message, evaluator)
    );
});


export const assignedEvaluators = asyncHandler(async (req: Request, res: Response) => {
    const evaluators = await User.find({ userType: "evaluator", isApproved: true });

    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Evaluators Fetched successfully",
                evaluators
            ));
});

export const teamList = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const skip = (page - 1) * limit

    const userSelect = "profile.name -_id"

    const totalTeams = await Team.countDocuments()
    const totalSubmitted = await Team.countDocuments({ status: "submitted" })

    const teams = await Team.find()
        .select("-members -maxMembers -__v")
        .populate([{ path: "teamLeadId", select: userSelect }])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

    return res.status(200).json(
        new ApiResponse(true, "Teams fetched successfully", {
            totalTeams,
            totalSubmitted,
            page,
            totalPages: Math.ceil(totalTeams / limit),
            teams,
        })
    )
})


export const teamDetails = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const team = await Team.findById(id);
    if (!team) {
        throw new ApiError(404, "Team not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Team Fetched successfully",
                team
            ));
});

export const teamUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const team = await Team.findOne({
        $or: [
            { teamLeadId: id },
            { "members": id }
        ]
    })
        .populate("teamLeadId", "-password -evaluationStats -isApproved")
        .populate("members", "-password -evaluationStats -isApproved");

    if (!team) {
        throw new ApiError(404, "Team not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Team Fetched successfully",
                team
            ));
})

export const videos = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Fetch video details + status + averageScore with pagination
        const videos = await EvaluatorAssignment.find()
        .populate({
            path: "submissionId",
            select: "videoDetails submissionStatus teamId",
            populate: {
                path: "teamId",
                populate: [
                    { path: "teamLeadId", select: "profile.name email" },
                    { path: "members", select: "profile.name email" }
                ]
            }
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

    const formattedVideos = videos.map((v: any) => ({
        _id: v.submissionId?._id,
        videoDetails: v.submissionId?.videoDetails,
        submissionStatus: v.submissionId?.submissionStatus,
        team: v.submissionId?.teamId ?? null,
        averageScore: v.averageScore ?? null
    }));


    // Get counts by status
    const statusCounts = await EvaluatorAssignment.aggregate([
        {
            $lookup: {
                from: "submissions",
                localField: "submissionId",
                foreignField: "_id",
                as: "submission"
            }
        },
        { $unwind: "$submission" },
        {
            $group: {
                _id: "$submission.submissionStatus",
                count: { $sum: 1 }
            }
        }
    ]);

    let submitted = 0;
    let underReview = 0;
    let evaluated = 0;

    statusCounts.forEach(item => {
        if (item._id === "submitted") submitted = item.count;
        else if (item._id === "under_review") underReview = item.count;
        else if (item._id === "evaluated") evaluated = item.count;
    });

    const total = submitted + underReview + evaluated;
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json(
        new ApiResponse(true, "Videos fetched successfully", {
            videos: formattedVideos,
            pagination: { total, page, limit, totalPages },
            counts: { submitted, underReview, evaluated },
        })
    );
});

export const videoDetails = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const video = await Submission.findById(id)
        .populate({
            path: "teamId",
            populate: [
                { path: "teamLeadId", select: "profile.name email" },
                { path: "members", select: "profile.name email" }
            ]
        });
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Video Fetched successfully",
                video
            ));
});

export const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const video = await Submission.findByIdAndDelete(id);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Video deleted successfully"
            ));
});

export const result = asyncHandler(async (req: Request, res: Response) => {
    const evaluation = await EvaluatorAssignment.find({ completedEvaluations: 3 })
        .select("-assignedEvaluators -__v")
        .populate({
            path: "submissionId",
            populate: {
                path: "teamId",
                populate: {
                    path: "teamLeadId"
                }
            }
        })

    if (!evaluation) {
        throw new ApiError(404, "Result not found");
    }

    const resultData = evaluation.map((item: any) => ({
        _id: item._id,
        teamName: item.submissionId.teamId?.teamName,
        teamLead: item.submissionId.teamId?.teamLeadId?.profile.name,
        averageScore: item.averageScore,
        thumbnail: item.submissionId.videoDetails.thumbnail,
        title: item.submissionId.videoDetails.title,
        topic: item.submissionId.videoDetails.topic,
        evaluatedAt: item.updatedAt,
    }));

    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Result Fetched successfully",
                resultData
            ));
});

export const leaderboard = asyncHandler(async (req: Request, res: Response) => {
    const { topic } = req.query;

    const result = await Result.findOne({ isPublished: true });
    if (!result) {
        throw new ApiError(404, "Result not Found.");
    }

    // 🔹 Base pipeline
    const pipeline: any[] = [
        {
            $match: {
                completedEvaluations: 3,
            },
        },
        {
            $lookup: {
                from: "submissions",
                localField: "submissionId",
                foreignField: "_id",
                as: "submission",
            },
        },
        { $unwind: "$submission" },
    ];

    // 🔥 ADD topic filter ONLY if provided
    if (topic) {
        pipeline.push({
            $match: {
                "submission.videoDetails.topic": {
                    $regex: `^${topic}$`,
                    $options: "i",
                },
            },
        });
    }

    // 🔹 Remaining pipeline (unchanged)
    pipeline.push(
        {
            $lookup: {
                from: "teams",
                localField: "submission.teamId",
                foreignField: "_id",
                as: "team",
            },
        },
        { $unwind: "$team" },
        {
            $lookup: {
                from: "users",
                localField: "team.teamLeadId",
                foreignField: "_id",
                as: "teamLead",
            },
        },
        { $unwind: "$teamLead" },
        { $sort: { averageScore: -1 } }
    );

    const leaderboard = await EvaluatorAssignment.aggregate(pipeline);

    const leaderboardData = leaderboard.map((item: any) => ({
        _id: item._id,
        teamName: item.team.teamName,
        teamLead: item.teamLead.profile?.name,
        averageScore: item.averageScore,
        thumbnail: item.submission.videoDetails.thumbnail,
        title: item.submission.videoDetails.title,
        topic: item.submission.videoDetails.topic,
        evaluatedAt: item.updatedAt,
    }));

    return res.status(200).json(
        new ApiResponse(true, "Leaderboard Fetched successfully", leaderboardData)
    );
});

export const recentActivities = asyncHandler(async (req: Request, res: Response) => {
    const recentActivity = await RecentActivity.find().sort({ createdAt: -1 });
    if (!recentActivity) {
        throw new ApiError(404, "Recent Activity not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Recent Activity Fetched successfully",
                recentActivity
            ));
});

