import { Request, Response } from "express";
import { AuthRequest } from "../../types";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import {
    fetchAllUsers,
    fetchCurrentUser,
    fetchProfile,
    loginUser,
    registerUser,
} from "./auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { statusCode, message, data } = await registerUser(req.body);

    return res.status(statusCode).json(new ApiResponse(true, message, data));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const data = await loginUser(req.body);

    return res
        .status(200)
        .json(new ApiResponse(true, "Login successful", data));
});

export const profile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await fetchProfile(req.user?._id);

    return res
        .status(200)
        .json(new ApiResponse(true, "Profile fetched successfully", data));
});

export const allUsers = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const users = await fetchAllUsers(req.query);

        return res
            .status(200)
            .json(new ApiResponse(true, "Users fetched successfully", users));
    }
);

export const getCurrentUser = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userData = await fetchCurrentUser(req.user?._id);

        return res
            .status(200)
            .json(new ApiResponse(true, "Profile fetched successfully", userData));
    }
);
