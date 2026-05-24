import { Router } from "express";
import { createRoleBasedJWTMiddleware } from "../../middlewares/getUser.middleware";
import { deleteFileHandler, getUploadUrlHandler } from "./upload.controller";

const router = Router();

router.post(
    "/get-presigned-url",
    createRoleBasedJWTMiddleware(),
    getUploadUrlHandler
);
router.delete("/delete-file", createRoleBasedJWTMiddleware(), deleteFileHandler);

export default router;
