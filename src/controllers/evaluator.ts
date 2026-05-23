import { asyncHandler } from "../utils/asyncHandler";
import { Response } from "express";
import { User } from "../models/User";
import { EvaluatorAssignment } from "../models/EvaluatorAssignment";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { Evaluation } from "../models/Evaluation";
import { Submission } from "../models/Submission";
import { RecentActivity } from "../models/recentActivities";
import { Result } from "../models/Result";
import { buildPaginationMeta, getPaginationParams } from "../services/pagination.service";
import { AuthRequest } from "../types";

export const dashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  // Fetch evaluator's assigned videos
  const allVideos = await Evaluation.find({
    evaluatorId: userId,
  })
    .select("-assignedEvaluators")
    .populate({
      path: "submissionId",
      populate: {
        path: "teamId"
      }
    })
    .limit(3);

  // Extract stats from evaluator’s user model
  const stats = {
    total: req.user?.evaluationStats?.totalAssigned,
    completed: req.user?.evaluationStats?.totalCompleted,
    pending:
      (req.user?.evaluationStats?.totalAssigned as number) -
      (req.user?.evaluationStats?.totalCompleted as number),
    average: req.user?.evaluationStats?.averageScore,
  };

  // Prepare the latest assigned videos
  const assignedVideos = allVideos.map((video: any) => ({
    _id: video.submissionId._id,
    title: video.submissionId.videoDetails.title,
    topic: video.submissionId.videoDetails.topic,
    teamName: video.submissionId.teamId?.teamName,
    submissionStatus: video.evaluationStatus,
  }));

  /// ✅ Fetch all evaluated submissions for this evaluator
  const evaluatedSubmissions = await Evaluation.find({
    evaluatorId: userId,
    evaluationStatus: "completed",
  }).populate("submissionId");

  // ✅ Extract numeric total scores
  const scores = evaluatedSubmissions
    .map((e: any) => e.totalScore)

  // ✅ Simplified score distribution (only 3 ranges)
  const scoreDistribution = [
    { name: "80-100 (Excellent)", min: 80, max: 100, fill: "#10b981", value: 0 },
    { name: "60-79 (Good)", min: 60, max: 79, fill: "#3b82f6", value: 0 },
    { name: "0-59 (Needs Improvement)", min: 0, max: 59, fill: "#ef4444", value: 0 },
  ];

  scores.forEach((score) => {
    const range = scoreDistribution.find((r) => score >= r.min && score <= r.max);
    if (range) range.value += 1;
  });

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
        averageScore: Math.round(item.averageScore) || 0,
        thumbnail: team?.thumbnail || "/default-thumbnail.png", // add default thumbnail
        teamLead: teamLead?.name || "N/A",
        topic: item.submissionId?.topic || "N/A",
      };
    });
  } else {
    leaderboardData = [];
  }


  // ✅ Final response
  return res.status(201).json(
    new ApiResponse(true, "Dashboard data fetched successfully", {
      stats,
      assignedVideos,
      scoreDistribution,
      leaderboardData,
    })
  );
});

export const videos = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { page, limit, skip } = getPaginationParams(req.query);

  const total = await Evaluation.countDocuments({ evaluatorId: userId });

  const assignedVideos = await Evaluation.find({
    evaluatorId: userId,
  })
    .select("-assignedEvaluators")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "submissionId",
      populate: {
        path: "teamId"
      }
    })

  const videos = assignedVideos.map((video: any) => ({
    videoDetails: video.submissionId.videoDetails,
    teamName: video.submissionId.teamId?.teamName,
    submissionStatus: video.evaluationStatus,
    _id: video.submissionId._id,
  }));

  const pagination = buildPaginationMeta(total, page, limit);

  return res
    .status(201)
    .json(
      new ApiResponse(
        true,
        "Videos Fetched Successfully",
        { videos, pagination }
      )
    );
});
// export const videos = asyncHandler(async (req: AuthRequest, res: Response) => {
//   const userId = req.user?.id;

//   const assignedVideos = await EvaluatorAssignment.find({
//     "assignedEvaluators.evaluatorId": userId,
//   })
//     .select("-assignedEvaluators")
//     .populate({
//       path: "submissionId",
//       populate: {
//         path: "teamId"
//       }
//     })

//   const cleanVideos = assignedVideos.map((video: any) => ({
//     videoDetails: video.submissionId.videoDetails,
//     teamName: video.submissionId.teamId?.teamName,
//     submissionStatus: video.submissionId.submissionStatus,
//     _id: video.submissionId._id,
//   }));

//   return res
//     .status(201)
//     .json(
//       new ApiResponse(
//         true,
//         "Videos Fetched Successfully",
//         cleanVideos
//       )
//     );
// });

export const evaluate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;

  const {
    submissionId,
    relevanceToLearningObjectives,
    innovationCreativity,
    clarityAccessibility,
    depth,
    interactivityEngagement,
    useOfTechnology,
    scalabilityAdaptability,
    alignmentEthicalStandards,
    practicalApplication,
    videoQuality,
    comment
  } = req.body;

  if (
    !submissionId ||
    !relevanceToLearningObjectives ||
    !innovationCreativity ||
    !clarityAccessibility ||
    !depth ||
    !interactivityEngagement ||
    !useOfTechnology ||
    !scalabilityAdaptability ||
    !alignmentEthicalStandards ||
    !practicalApplication ||
    !videoQuality ||
    !comment
  ) {
    throw new ApiError(400, "Missing required fields");
  }

  const totalScore =
    relevanceToLearningObjectives +
    innovationCreativity +
    clarityAccessibility +
    depth +
    interactivityEngagement +
    useOfTechnology +
    scalabilityAdaptability +
    alignmentEthicalStandards +
    practicalApplication +
    videoQuality;

  const existingEvaluation = await Evaluation.findOne({
    submissionId,
    evaluatorId: userId,
    evaluationStatus: "completed"
  });

  if (existingEvaluation) {
    throw new ApiError(400, "Evaluation already exists");
  }

  const evaluation = await Evaluation.updateOne(
    {
      submissionId: submissionId,
      evaluatorId: userId
    },
    {
      $set: {
        scores: {
          relevanceToLearningObjectives,
          innovationCreativity,
          clarityAccessibility,
          depth,
          interactivityEngagement,
          useOfTechnology,
          scalabilityAdaptability,
          alignmentEthicalStandards,
          practicalApplication,
          videoQuality,
        },
        totalScore: totalScore,
        comment: comment,
        evaluationStatus: "completed",
      }
    }
  );

  await EvaluatorAssignment.updateOne(
    { submissionId, "assignedEvaluators.evaluatorId": userId },
    {
      $set: {
        "assignedEvaluators.$.evaluationStatus": "completed",
        "assignedEvaluators.$.totalScore": totalScore,
      },
      $inc: { completedEvaluations: 1 },
    }
  );

  const assignment = await EvaluatorAssignment.findOne({ submissionId }).populate({
    path: "submissionId",
    populate: {
      path: "teamId"
    }
  })

  if (
    assignment &&
    assignment.completedEvaluations === assignment.totalEvaluators
  ) {
    const avgScore =
      assignment.assignedEvaluators.length > 0
        ? assignment.assignedEvaluators.reduce((sum, ev) => sum + (ev.totalScore || 0), 0) /
        assignment.assignedEvaluators.length
        : 0;

    await EvaluatorAssignment.updateOne(
      { submissionId },
      { $set: { averageScore: Math.round(avgScore) } }
    );

    await Submission.updateOne(
      { _id: submissionId },
      { $set: { submissionStatus: "evaluated" } }
    );
  }


  const user = await User.findById(userId);
  const prevTotal = user?.evaluationStats?.totalCompleted || 0;
  const prevAverage = user?.evaluationStats?.averageScore || 0;

  const newAverage =
    (prevAverage * prevTotal + totalScore) / (prevTotal + 1);

  await User.updateOne(
    { _id: userId },
    {
      $inc: { "evaluationStats.totalCompleted": 1 },
      $set: { "evaluationStats.averageScore": Math.round(newAverage) },
    }
  );

  const populatedSubmission = assignment?.submissionId as any;
  const team = populatedSubmission?.teamId as any;

  await RecentActivity.create({
    title: `Evaluator ${user?.profile?.name} Completed Evaluation of team ${team?.teamName}`,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(true, "Evaluation Created Successfully", evaluation)
    );
});

export const evaluatedVideos = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { page, limit, skip } = getPaginationParams(req.query);

  const filter = {
    evaluatorId: userId,
    evaluationStatus: "completed",
  };

  const total = await Evaluation.countDocuments(filter);

  const evaluatedVideos = await Evaluation.find(filter)
    .sort({ createdAt: -1 })
    .select('-scores')
    .skip(skip)
    .limit(limit)
    .populate({
      path: "submissionId",
      populate: {
        path: "teamId"
      }
    });

  const videos = evaluatedVideos.map((video: any) => ({
    _id: video.submissionId._id,
    teamName: video.submissionId.teamId?.teamName,
    totalScore: video.totalScore,
    thumbnailKey: video.submissionId.videoDetails.thumbnailKey,
    title: video.submissionId.videoDetails.title,
    topic: video.submissionId.videoDetails.topic,
    createdAt: video.createdAt,
  }));

  const pagination = buildPaginationMeta(total, page, limit);

  return res.status(200).json(
    new ApiResponse(
      true,
      "Evaluated Videos Fetched Successfully",
      { videos, pagination }
    )
  );
});

