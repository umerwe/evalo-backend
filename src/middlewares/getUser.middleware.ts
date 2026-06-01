import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { config } from '../config/env';

export const createRoleBasedJWTMiddleware = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return next(new ApiError(401, 'Please login first (No token provided)'));
            }

            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, config.jwtSecret!) as { id: string };

            const user = await User.findOne({ _id: decoded.id });
            if (!user) return next(new ApiError(401, 'Invalid or expired token'));

            (req as any).user = user;
            next();
        } catch (err: any) {
            next(err);
        }
    };
};