import { EvaluatorAssignment } from "../../models/EvaluatorAssignment";
import { RecentActivity } from "../../models/recentActivities";
import { Result } from "../../models/Result";
import { Submission } from "../../models/Submission";
import { Team } from "../../models/Team";
import { User } from "../../models/User";
import {
    buildPaginationMeta,
    getPaginationParams,
} from "../../utils/pagination.utils";
import { ApiError } from "../../utils/ApiError";

export const fetchDashboard = async () => {
    const stats = {
        teams: await Team.countDocuments(),
        assignedEvaluators: await User.countDocuments({ isApproved: true }),
        totalVideos: await Submission.countDocuments(),
        totalEvaluations: await EvaluatorAssignment.countDocuments({
            completedEvaluations: 3,
        }),
    };

    const totalSubmissions = await Submission.countDocuments();
    const completedEvaluations = await EvaluatorAssignment.countDocuments({
        completedEvaluations: 3,
    });
    const pendingEvaluations = totalSubmissions - completedEvaluations;

    const recentActivities = await RecentActivity.find()
        .sort({ createdAt: -1 })
        .limit(3);

    const submissionTrendData = [
        {
            name: "Submissions Created",
            value: totalSubmissions,
        },
        {
            name: "Submissions Completed",
            value: completedEvaluations,
        },
        {
            name: "Pending Evaluations",
            value: pendingEvaluations,
        },
    ];

    let leaderboardData: any[] = [];
    const result = await Result.findOne({ isPublished: true });

    if (result) {
        const leaderboard = await EvaluatorAssignment.find({
            completedEvaluations: 3,
        })
            .sort({ averageScore: -1 })
            .limit(3)
            .populate({
                path: "submissionId",
                populate: {
                    path: "teamId",
                    populate: { path: "teamLeadId" },
                },
            });

        leaderboardData = leaderboard.map((item: any) => {
            const team = item.submissionId.teamId;
            const teamLead = team?.teamLeadId;

            return {
                teamName: team?.teamName || "Unknown Team",
                averageScore: item.averageScore || 0,
                thumbnail: team?.thumbnail || "/default-thumbnail.png",
                teamLead: teamLead?.name || "N/A",
                topic: item.submissionId?.topic || "N/A",
            };
        });
    } else {
        leaderboardData = [];
    }

    return {
        stats,
        evaluationStatus: {
            evaluatedVideos: completedEvaluations,
            pendingVideos: pendingEvaluations,
        },
        leaderboardData,
        submissionTrendData,
        recentActivities,
    };
};

export const fetchEvaluatorList = async (query: any) => {
    const { page, limit, skip } = getPaginationParams(query);

    const total = await User.countDocuments({ userType: "evaluator" });
    const approved = await User.countDocuments({
        userType: "evaluator",
        isApproved: true,
    });
    const pending = total - approved;

    const evaluators = await User.find({ userType: "evaluator" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const pagination = buildPaginationMeta(total, page, limit);

    return {
        evaluators,
        total,
        approved,
        pending,
        pagination,
    };
};

export const fetchEvaluatorDetails = async (id: string) => {
    const evaluator = await User.findOne({ _id: id, userType: "evaluator" });

    if (!evaluator) {
        throw new ApiError(404, "Evaluator not found");
    }

    return evaluator;
};

export const toggleEvaluatorAssignment = async (id: string) => {
    const evaluator = await User.findById(id);

    if (!evaluator) {
        throw new ApiError(404, "Evaluator not found");
    }

    if (evaluator.userType !== "evaluator") {
        throw new ApiError(400, "User is not an evaluator");
    }

    if (!evaluator.isApproved) {
        const approvedEvaluatorsCount = await User.countDocuments({
            userType: "evaluator",
            isApproved: true,
        });

        if (approvedEvaluatorsCount >= 3) {
            throw new ApiError(
                400,
                "Only 3 evaluators are allowed to be approved"
            );
        }
    }

    evaluator.isApproved = !evaluator.isApproved;
    await evaluator.save();

    const message = evaluator.isApproved
        ? "Evaluator approved successfully"
        : "Evaluator approval revoked successfully";

    return { evaluator, message };
};

export const fetchAssignedEvaluators = async () => {
    return User.find({ userType: "evaluator", isApproved: true });
};

export const fetchTeamList = async (query: any) => {
    const { page, limit, skip } = getPaginationParams(query);

    const userSelect = "profile.name -_id";

    const totalTeams = await Team.countDocuments();
    const totalSubmitted = await Team.countDocuments({ status: "submitted" });

    const teams = await Team.find()
        .select("-members -maxMembers -__v")
        .populate([{ path: "teamLeadId", select: userSelect }])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const { totalPages } = buildPaginationMeta(totalTeams, page, limit);

    return {
        totalTeams,
        totalSubmitted,
        page,
        totalPages,
        teams,
    };
};

export const fetchTeamDetails = async (id: string) => {
    const team = await Team.findById(id);

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    return team;
};

export const fetchTeamUser = async (id: string) => {
    const team = await Team.findOne({
        $or: [{ teamLeadId: id }, { members: id }],
    })
        .populate("teamLeadId", "-password -evaluationStats -isApproved")
        .populate("members", "-password -evaluationStats -isApproved");

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    return team;
};

export const fetchVideos = async (query: any) => {
    const { page, limit, skip } = getPaginationParams(query);

    const videos = await EvaluatorAssignment.find()
        .populate({
            path: "submissionId",
            select: "videoDetails submissionStatus teamId",
            populate: {
                path: "teamId",
                populate: [
                    { path: "teamLeadId", select: "profile.name email" },
                    { path: "members", select: "profile.name email" },
                ],
            },
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
        averageScore: v.averageScore ?? null,
    }));

    const statusCounts = await EvaluatorAssignment.aggregate([
        {
            $lookup: {
                from: "submissions",
                localField: "submissionId",
                foreignField: "_id",
                as: "submission",
            },
        },
        { $unwind: "$submission" },
        {
            $group: {
                _id: "$submission.submissionStatus",
                count: { $sum: 1 },
            },
        },
    ]);

    let submitted = 0;
    let underReview = 0;
    let evaluated = 0;

    statusCounts.forEach((item) => {
        if (item._id === "submitted") submitted = item.count;
        else if (item._id === "under_review") underReview = item.count;
        else if (item._id === "evaluated") evaluated = item.count;
    });

    const total = submitted + underReview + evaluated;
    const pagination = buildPaginationMeta(total, page, limit);

    return {
        videos: formattedVideos,
        pagination,
        counts: { submitted, underReview, evaluated },
    };
};

export const fetchVideoDetails = async (id: string) => {
    const video = await Submission.findById(id).populate({
        path: "teamId",
        populate: [
            { path: "teamLeadId", select: "profile.name email" },
            { path: "members", select: "profile.name email" },
        ],
    });

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return video;
};

export const removeVideo = async (id: string) => {
    const video = await Submission.findByIdAndDelete(id);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }
};

export const fetchResult = async (query: any) => {
    const { page, limit, skip } = getPaginationParams(query);

    const total = await EvaluatorAssignment.countDocuments({
        completedEvaluations: 3,
    });

    const evaluation = await EvaluatorAssignment.find({
        completedEvaluations: 3,
    })
        .select("-assignedEvaluators -__v")
        .populate({
            path: "submissionId",
            populate: {
                path: "teamId",
                populate: {
                    path: "teamLeadId",
                },
            },
        })
        .sort({ averageScore: -1 })
        .skip(skip)
        .limit(limit);

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

    const pagination = buildPaginationMeta(total, page, limit);

    return {
        results: resultData,
        pagination,
    };
};

export const fetchLeaderboard = async (query: any) => {
    const { topic } = query;
    const { page, limit, skip } = getPaginationParams(query);

    const result = await Result.findOne({ isPublished: true });

    if (!result) {
        throw new ApiError(404, "Result not Found.");
    }

    const basePipeline: any[] = [
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

    if (topic) {
        basePipeline.push({
            $match: {
                "submission.videoDetails.topic": {
                    $regex: `^${topic}$`,
                    $options: "i",
                },
            },
        });
    }

    const totalAgg = await EvaluatorAssignment.aggregate([
        ...basePipeline,
        { $count: "total" },
    ]);
    const total = totalAgg[0]?.total ?? 0;

    const dataPipeline: any[] = [
        ...basePipeline,
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
        { $sort: { averageScore: -1 } },
        { $skip: skip },
        { $limit: limit },
    ];

    const leaderboard = await EvaluatorAssignment.aggregate(dataPipeline);

    const leaderboardData = leaderboard.map((item: any) => ({
        _id: item._id,
        teamName: item.team.teamName,
        teamLead: item.teamLead.profile?.name,
        averageScore: item.averageScore,
        thumbnail: item.submission.videoDetails.thumbnailKey,
        title: item.submission.videoDetails.title,
        topic: item.submission.videoDetails.topic,
        evaluatedAt: item.updatedAt,
    }));

    const pagination = buildPaginationMeta(total, page, limit);

    return {
        leaderboard: leaderboardData,
        pagination,
    };
};

export const fetchRecentActivities = async () => {
    const recentActivity = await RecentActivity.find().sort({ createdAt: -1 });

    if (!recentActivity) {
        throw new ApiError(404, "Recent Activity not found");
    }

    return recentActivity;
};
