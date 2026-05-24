import { Router } from "express";
import { createRoleBasedJWTMiddleware } from "../../middlewares/getUser.middleware";
import {
    allUsers,
    getCurrentUser,
    login,
    profile,
    register,
} from "./auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", createRoleBasedJWTMiddleware(), profile);
router.get("/all-users", createRoleBasedJWTMiddleware(), allUsers);
router.get("/current-user", createRoleBasedJWTMiddleware(), getCurrentUser);

export default router;
