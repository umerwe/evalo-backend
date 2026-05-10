import { Router } from "express";
import { getUploadUrlHandler, deleteFileHandler } from "../controllers/upload.controller";
import { createRoleBasedJWTMiddleware } from "../middlewares/getUser";

const router = Router();

router.post("/get-presigned-url", createRoleBasedJWTMiddleware(), getUploadUrlHandler);
router.delete("/delete-file", createRoleBasedJWTMiddleware(), deleteFileHandler);

export default router;