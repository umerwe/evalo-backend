import { Router } from "express";
import { createRoleBasedJWTMiddleware } from "../../middlewares/getUser.middleware";
import {
    dashboard,
    detailedResult,
    evaluatorFeedback,
    getTeam,
    result,
    submitVideo,
} from "./team.controller";

const router = Router();

router.get("/dashboard", createRoleBasedJWTMiddleware(), dashboard);
router.post("/submit-video", createRoleBasedJWTMiddleware(), submitVideo);
router.get("/get", createRoleBasedJWTMiddleware(), getTeam);
router.get("/evaluator-feedback", createRoleBasedJWTMiddleware(), evaluatorFeedback);
router.get("/result", createRoleBasedJWTMiddleware(), result);
router.get("/detailed-result", createRoleBasedJWTMiddleware(), detailedResult);

export default router;
