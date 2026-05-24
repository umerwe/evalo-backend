import { Router } from "express";
import { createRoleBasedJWTMiddleware } from "../../middlewares/getUser.middleware";
import { videoDetails } from "../admin/admin.controller";
import {
    dashboard,
    evaluate,
    evaluatedVideos,
    videos,
} from "./evaluator.controller";

const router = Router();

router.get("/dashboard", createRoleBasedJWTMiddleware(), dashboard);
router.get("/videos", createRoleBasedJWTMiddleware(), videos);
router.get("/video/:id", createRoleBasedJWTMiddleware(), videoDetails);
router.post("/evaluate", createRoleBasedJWTMiddleware(), evaluate);
router.get("/evaluated-videos", createRoleBasedJWTMiddleware(), evaluatedVideos);

export default router;
