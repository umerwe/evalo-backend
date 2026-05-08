import { Router } from "express"
import { login, logout, register, profile, allUsers, getCurrentUser } from "../controllers/auth"
import { createRoleBasedJWTMiddleware } from "../middlewares/getUser"

const router = Router()

router.post("/register", register)

router.post("/login", login)

router.post("/logout", logout)

router.get("/profile", createRoleBasedJWTMiddleware(), profile)

router.get("/all-users", createRoleBasedJWTMiddleware(), allUsers)

router.get("/current-user", createRoleBasedJWTMiddleware(), getCurrentUser)

export default router