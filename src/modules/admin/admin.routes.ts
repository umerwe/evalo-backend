import { Router } from "express";
import {
    assignedEvaluators,
    assignEvaluator,
    dashboard,
    deleteVideo,
    evaluatorDetails,
    evaluatorList,
    leaderboard,
    recentActivities,
    result,
    teamDetails,
    teamList,
    teamUser,
    videoDetails,
    videos,
} from "./admin.controller";

const router = Router();

router.get("/dashboard", dashboard);
router.get("/evaluator-list", evaluatorList);
router.get("/evaluator/:id", evaluatorDetails);
router.post("/assign-evaluator/:id", assignEvaluator);
router.get("/assigned-evaluators", assignedEvaluators);
router.get("/team-list", teamList);
router.get("/team/:id", teamDetails);
router.get("/team/user/:id", teamUser);
router.get("/videos", videos);
router.get("/video/:id", videoDetails);
router.delete("/video/:id", deleteVideo);
router.get("/result", result);
router.get("/leaderboard", leaderboard);
router.get("/recent-activities", recentActivities);

export default router;
