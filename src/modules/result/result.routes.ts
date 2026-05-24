import { Router } from "express";
import { createRoleBasedJWTMiddleware } from "../../middlewares/getUser.middleware";
import { getResult, setResultStatus } from "./result.controller";

const router = Router();

router.post(
    "/toggle-result-status",
    createRoleBasedJWTMiddleware(),
    setResultStatus
);
router.get("/result-status", getResult);

export default router;
