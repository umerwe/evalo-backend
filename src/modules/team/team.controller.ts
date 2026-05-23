import { Submission } from "../../models/Submission";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { Response } from "express";

import { User } from "../../models/User";
import { Team } from "../../models/Team";
import { EvaluatorAssignment } from "../../models/EvaluatorAssignment";
import { Evaluation } from "../../models/Evaluation";
import mongoose from "mongoose";
import { RecentActivity } from "../../models/recentActivities";
import { Result } from "../../models/Result";
import { deleteFromS3 } from "../../services/s3.service";
import { PendingUpload } from "../../models/PendingUpload";
import { AuthRequest } from "../../types";

export const dashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;

    const team = await Team.findOne({
        $or: [
            { teamLeadId: userId },
            { "members": userId }
        ]
    })
        .populate("teamLeadId", "-password -evaluationStats -isApproved")
        .populate("members", "profile email -_id");

    if (!team) throw new ApiError(404, "Team not found");

    const submission = await Submission.findOne({ teamId: team._id });

    const evaluation = await Evaluation.find({
        submissionId: submission?._id,
        evaluationStatus: "completed"
    })
        .select("evaluatorId comment totalScore")
        .populate("evaluatorId", "profile email -_id");

    if (!evaluation) {
        throw new ApiError(404, "Evaluation not found");
    }

    const allEvaluations = await EvaluatorAssignment.findOne({ submissionId: submission?._id });

    // Data for stats
    const stats = {
        status: team.status,
        total_score: allEvaluations?.averageScore,
        members: team.totalMembers,
        evaluation_status: `${allEvaluations?.completedEvaluations === 3 ? "Completed" : "Pending"}`,
    }

    const evaluatorFeedback = evaluation.slice(0, 2).map((item: any) => {
        return {
            name: item.evaluatorId?.profile?.name,
            comment: item.comment,
            score: item.totalScore,
        }
    })
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

        leaderboardData = leaderboard.slice(0, 4).map((item: any) => {
            const team = item.submissionId.teamId;
            const teamLead = team?.teamLeadId;

            return {
                teamName: team?.teamName || "Unknown Team",
                averageScore: Math.round(item.averageScore) || 0,
                thumbnail: team?.thumbnail || "/default-thumbnail.png",
                teamLead: teamLead?.name || "N/A",
                topic: item.submissionId?.topic || "N/A",
            };
        });
    } else {
        leaderboardData = [];
    }


    // let leaderboardData: any[] = [];

    // if (leaderboard && leaderboard.length === 5) {
    //     const top3 = leaderboard.slice(0, 3);

    //     leaderboardData = top3.map((item: any) => ({
    //         teamName: item.submissionId.teamId?.teamName,
    //         averageScore: item.averageScore,
    //     }));
    // }

    // const leaderboardData = leaderboard.slice(0, 3).map((item: any) => ({
    //     teamName: item.submissionId.teamId?.teamName,
    //     averageScore: item.averageScore,
    // }));

    // ----------------------------
    // 🆕 Added Team Progress Chart
    // ----------------------------
    // Use evaluator assignment details to show progress of evaluations
    let teamProgressChart: any[] = [];

    if (evaluation.length > 0) {
        evaluation.forEach((ev: any, index: number) => {
            teamProgressChart.push({
                evaluator: ev.evaluatorId?.profile?.name,
                totalScore: ev.totalScore || 0,
            });
        });
    } else {
        teamProgressChart = [];
    }


    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Dashboard fetched successfully",
                {
                    teamName: team.teamName,
                    stats,
                    evaluatorFeedback,
                    leaderboardData,
                    teamProgressChart
                }
            ));
});

export const submitVideo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    const {
        title,
        description,
        topic,
        learningOutcomes,
        videoKey,
        thumbnailKey,
        durationInSeconds,
    } = req.body;

    if (
        !title || !description || !topic || !learningOutcomes ||
        !videoKey || !thumbnailKey ||
        durationInSeconds === undefined
    ) {
        throw new ApiError(400, "All fields are required including uploaded video and thumbnail info");
    }

    // 2. Validate duration (5 min max)
    if (durationInSeconds > 5 * 60) {
        // Delete the orphaned file from S3 since submission is invalid
        await deleteFromS3(videoKey).catch(() => { });
        await deleteFromS3(thumbnailKey).catch(() => { });
        throw new ApiError(400, "Video duration cannot exceed 5 minutes");
    }

    // 3. Find team
    const team = await Team.findOne({
        $or: [
            { teamLeadId: userId },
            { members: userId }
        ]
    })
        .populate("teamLeadId", "-password -evaluationStats -isApproved")
        .populate("members", "profile email -_id");

    if (!team) {
        // Clean up uploaded files since submission won't go through
        await deleteFromS3(videoKey).catch(() => { });
        await deleteFromS3(thumbnailKey).catch(() => { });
        throw new ApiError(404, "Team not found");
    }

    if (team.status === "submitted") {
        await deleteFromS3(videoKey).catch(() => { });
        await deleteFromS3(thumbnailKey).catch(() => { });
        throw new ApiError(400, "Team already submitted");
    }

    const teamId = team._id;

    // 4. Format duration
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    const formattedDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    // 5. Save submission
    const submission = await Submission.create({
        teamId,
        videoDetails: {
            videoKey,
            thumbnailKey,
            title,
            description,
            topic,
            learningOutcomes,
            duration: formattedDuration,
        },
        submissionStatus: "submitted",
    });

    await PendingUpload.deleteMany({
        fileKey: { $in: [videoKey, thumbnailKey] }
    });


    // 6. Assign evaluators (unchanged)
    const assignedEvaluators = await User.find({
        userType: "evaluator",
        isApproved: true,
    });

    if (!assignedEvaluators.length) {
        throw new ApiError(404, "No approved evaluators found");
    }

    await User.updateMany(
        { userType: "evaluator", isApproved: true },
        { $inc: { "evaluationStats.totalAssigned": 1 } }
    );

    const assignedEvaluatorsId = assignedEvaluators.map((item) => ({
        evaluatorId: item._id,
        evaluationStatus: "pending",
    }));

    await EvaluatorAssignment.create({
        submissionId: submission._id,
        assignedEvaluators: assignedEvaluatorsId,
        completedEvaluations: 0,
    });

    const evaluationsToCreate = assignedEvaluators.map((e) => ({
        submissionId: submission._id,
        evaluatorId: e._id,
        totalScore: 0,
    }));

    await Evaluation.insertMany(evaluationsToCreate);

    await Submission.updateOne(
        { _id: submission._id },
        { submissionStatus: "under_review" }
    );

    await Team.updateOne({ _id: teamId }, { status: "submitted" });

    await RecentActivity.create({
        title: `Team ${team?.teamName} Submitted Video`,
    });

    return res
        .status(201)
        .json(new ApiResponse(true, "Video submitted successfully", submission));
});

export const getTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;

    const team = await Team.findOne({
        $or: [
            { teamLeadId: userId },
            { "members": userId }
        ]
    })
        .populate("teamLeadId", "-password -evaluationStats -isApproved")
        .populate("members", "profile email -_id");

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Team fetched successfully",
                team
            ));
});

export const evaluatorFeedback = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;

    const team = await Team.findOne({
        $or: [
            { teamLeadId: userId },
            { "members": userId }
        ]
    });

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    const submission = await Submission.findOne({ teamId: team._id });

    if (!submission) {
        throw new ApiError(404, "Submission not found");
    }

    const evaluation = await Evaluation.find({
        submissionId: new mongoose.Types.ObjectId(submission._id as string),
        evaluationStatus: "completed"

    })
        .select("evaluatorId comment")
        .populate("evaluatorId", "profile email -_id");

    if (!evaluation) {
        throw new ApiError(404, "Evaluation not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Team fetched successfully",
                evaluation
            ));
});

export const result = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;

    const result = await Result.findOne({ isPublished: true });

    if (!result) {
        throw new ApiError(404, "Result not Found.")
    }

    const team = await Team.findOne({
        $or: [
            { teamLeadId: userId },
            { "members": userId }
        ]
    });

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    const submission = await Submission.findOne({ teamId: team._id })
        .select("videoDetails")

    if (!submission) {
        throw new ApiError(404, "Submission not found");
    }

    const evaluation = await EvaluatorAssignment.findOne({
        submissionId: new mongoose.Types.ObjectId(submission._id as string)
    })

    if (!evaluation) {
        throw new ApiError(404, "Evaluation not found");
    }

    if (evaluation?.completedEvaluations !== 3) {
        throw new ApiError(404, "Result Not Submitted");
    }

    const resultData = {
        teamName: team.teamName,
        videoDetails: submission.videoDetails,
        averageScore: evaluation.averageScore
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Result fetched successfully",
                resultData
            ));
});

export const detailedResult = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;

    const team = await Team.findOne({
        $or: [
            { teamLeadId: userId },
            { "members": userId }
        ]
    });

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    const submission = await Submission.findOne({ teamId: team._id })
        .select("videoDetails")

    if (!submission) {
        throw new ApiError(404, "Submission not found");
    }

    const evaluation = await Evaluation.find({ submissionId: submission._id, evaluationStatus: "completed" })
        .select('-submissionId')
        .populate('evaluatorId', 'profile email')

    if (!evaluation) {
        throw new ApiError(404, "Result not submitted");
    }

    const detailedResult = evaluation.map((item: any) => ({
        evaluatorName: item.evaluatorId.profile.name,
        evaluatorEmail: item.evaluatorId.email,
        comment: item.comment,
        scores: item.scores,
    }))


    return res
        .status(200)
        .json(
            new ApiResponse(
                true,
                "Video Fetched successfully",
                detailedResult
            ));
});
