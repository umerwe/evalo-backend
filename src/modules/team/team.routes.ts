import { Router } from "express";
import { evaluatorFeedback, getTeam, submitVideo ,result, detailedResult, dashboard} from "./team.controller";
import { createRoleBasedJWTMiddleware } from "../../middlewares/getUser";

const router = Router();

router.get("/dashboard", createRoleBasedJWTMiddleware(), dashboard);

router.post(
  "/submit-video",
  createRoleBasedJWTMiddleware(),
  submitVideo
);

router.get("/get", createRoleBasedJWTMiddleware(), getTeam);

router.get("/evaluator-feedback", createRoleBasedJWTMiddleware(), evaluatorFeedback);

router.get("/result", createRoleBasedJWTMiddleware(), result);

router.get("/detailed-result", createRoleBasedJWTMiddleware(), detailedResult);

export default router;
