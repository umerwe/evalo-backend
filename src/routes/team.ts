import { Router } from "express";
import { evaluatorFeedback, getTeam, submitVideo ,result, detailedResult} from "../controllers/team";
import upload from "../middlewares/upload";
import { createRoleBasedJWTMiddleware } from "../middlewares/getUser";
import { dashboard } from "../controllers/team";

const router = Router();

router.get("/dashboard", createRoleBasedJWTMiddleware(), dashboard);

router.post(
  "/submit-video",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  createRoleBasedJWTMiddleware(),
  submitVideo
);

router.get("/get", createRoleBasedJWTMiddleware(), getTeam);

router.get("/evaluator-feedback", createRoleBasedJWTMiddleware(), evaluatorFeedback);

router.get("/result", createRoleBasedJWTMiddleware(), result);

router.get("/detailed-result", createRoleBasedJWTMiddleware(), detailedResult);

export default router;
