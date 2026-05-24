import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { config } from '../config/env';

export const createRoleBasedJWTMiddleware = () => {
    return async (req: any, res: any, next: any) => {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                throw new ApiError(401, 'Please login first (No token provided)');
            }

            const token = authHeader.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, config.jwtSecret!) as { id: string };

            // Check user
            const user = await User.findOne({ _id: decoded.id });
            if (!user) throw new ApiError(401, 'Invalid or expired token');

            req.user = user;
            next();
        } catch (err: any) {
            throw new ApiError(401, err.message || 'Invalid or expired token');
        }
    };
};