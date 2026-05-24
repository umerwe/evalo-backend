import mongoose from "mongoose";
import { Evaluation } from "../../models/Evaluation";
import { EvaluatorAssignment } from "../../models/EvaluatorAssignment";
import { PendingUpload } from "../../models/PendingUpload";
import { RecentActivity } from "../../models/recentActivities";
import { Result } from "../../models/Result";
import { Submission, SubmitVideoPayload } from "../../models/Submission";
import { Team } from "../../models/Team";
import { User } from "../../models/User";
import { deleteFromS3 } from "../../services/s3.service";
import { ApiError } from "../../utils/ApiError";

export const fetchDashboard = async (userId: any) => {
    const team = await Team.findOne({
        $or: [{ teamLeadId: userId }, { members: userId }],
    })
        .populate("teamLeadId", "-password -evaluationStats -isApproved")
        .populate("members", "profile email -_id");

    if (!team) throw new ApiError(404, "Team not found");

    const submission = await Submission.findOne({ teamId: team._id });

    const evaluation = await Evaluation.find({
        submissionId: submission?._id,
        evaluationStatus: "completed",
    })
        .select("evaluatorId comment totalScore")
        .populate("evaluatorId", "profile email -_id");

    if (!evaluation) {
        throw new ApiError(404, "Evaluation not found");
    }

    const allEvaluations = await EvaluatorAssignment.findOne({
        submissionId: submission?._id,
    });

    const stats = {
        status: team.status,
        total_score: allEvaluations?.averageScore,
        members: team.totalMembers,
        evaluation_status: `${allEvaluations?.completedEvaluations === 3 ? "Completed" : "Pending"}`,
    };

    const evaluatorFeedback = evaluation.slice(0, 2).map((item: any) => {
        return {
            name: item.evaluatorId?.profile?.name,
            comment: item.comment,
            score: item.totalScore,
        };
    });

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

    let teamProgressChart: any[] = [];

    if (evaluation.length > 0) {
        evaluation.forEach((ev: any) => {
            teamProgressChart.push({
                evaluator: ev.evaluatorId?.profile?.name,
                totalScore: ev.totalScore || 0,
            });
        });
    } else {
        teamProgressChart = [];
    }

    return {
        teamName: team.teamName,
        stats,
        evaluatorFeedback,
        leaderboardData,
        teamProgressChart,
    };
};

export const createVideoSubmission = async (
    userId: any,
    payload: SubmitVideoPayload
) => {
    const {
        title,
        description,
        topic,
        learningOutcomes,
        videoKey,
        thumbnailKey,
        durationInSeconds,
    } = payload;

    if (
        !title ||
        !description ||
        !topic ||
        !learningOutcomes ||
        !videoKey ||
        !thumbnailKey ||
        durationInSeconds === undefined
    ) {
        throw new ApiError(
            400,
            "All fields are required including uploaded video and thumbnail info"
        );
    }

    if (durationInSeconds > 5 * 60) {
        await deleteFromS3(videoKey).catch(() => {});
        await deleteFromS3(thumbnailKey).catch(() => {});
        throw new ApiError(400, "Video duration cannot exceed 5 minutes");
    }

    const team = await Team.findOne({
        $or: [{ teamLeadId: userId }, { members: userId }],
    })
        .populate("teamLeadId", "-password -evaluationStats -isApproved")
        .populate("members", "profile email -_id");

    if (!team) {
        await deleteFromS3(videoKey).catch(() => {});
        await deleteFromS3(thumbnailKey).catch(() => {});
        throw new ApiError(404, "Team not found");
    }

    if (team.status === "submitted") {
        await deleteFromS3(videoKey).catch(() => {});
        await deleteFromS3(thumbnailKey).catch(() => {});
        throw new ApiError(400, "Team already submitted");
    }

    const teamId = team._id;
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    const formattedDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

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
        fileKey: { $in: [videoKey, thumbnailKey] },
    });

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

    return submission;
};

export const fetchTeam = async (userId: any) => {
    const team = await Team.findOne({
        $or: [{ teamLeadId: userId }, { members: userId }],
    })
        .populate("teamLeadId", "-password -evaluationStats -isApproved")
        .populate("members", "profile email -_id");

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    return team;
};

export const fetchEvaluatorFeedback = async (userId: any) => {
    const team = await Team.findOne({
        $or: [{ teamLeadId: userId }, { members: userId }],
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
        evaluationStatus: "completed",
    })
        .select("evaluatorId comment")
        .populate("evaluatorId", "profile email -_id");

    if (!evaluation) {
        throw new ApiError(404, "Evaluation not found");
    }

    return evaluation;
};

export const fetchResult = async (userId: any) => {
    const result = await Result.findOne({ isPublished: true });

    if (!result) {
        throw new ApiError(404, "Result not Found.");
    }

    const team = await Team.findOne({
        $or: [{ teamLeadId: userId }, { members: userId }],
    });

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    const submission = await Submission.findOne({ teamId: team._id }).select(
        "videoDetails"
    );

    if (!submission) {
        throw new ApiError(404, "Submission not found");
    }

    const evaluation = await EvaluatorAssignment.findOne({
        submissionId: new mongoose.Types.ObjectId(submission._id as string),
    });

    if (!evaluation) {
        throw new ApiError(404, "Evaluation not found");
    }

    if (evaluation?.completedEvaluations !== 3) {
        throw new ApiError(404, "Result Not Submitted");
    }

    return {
        teamName: team.teamName,
        videoDetails: submission.videoDetails,
        averageScore: evaluation.averageScore,
    };
};

export const fetchDetailedResult = async (userId: any) => {
    const team = await Team.findOne({
        $or: [{ teamLeadId: userId }, { members: userId }],
    });

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    const submission = await Submission.findOne({ teamId: team._id }).select(
        "videoDetails"
    );

    if (!submission) {
        throw new ApiError(404, "Submission not found");
    }

    const evaluation = await Evaluation.find({
        submissionId: submission._id,
        evaluationStatus: "completed",
    })
        .select("-submissionId")
        .populate("evaluatorId", "profile email");

    if (!evaluation) {
        throw new ApiError(404, "Result not submitted");
    }

    return evaluation.map((item: any) => ({
        evaluatorName: item.evaluatorId.profile.name,
        evaluatorEmail: item.evaluatorId.email,
        comment: item.comment,
        scores: item.scores,
    }));
};
