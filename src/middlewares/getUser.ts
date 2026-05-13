import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';

export const createRoleBasedJWTMiddleware = () => {
    return async (req: any, res: any, next: any) => {
        try {
            // 1. Get token from Authorization Header (Format: Bearer <token>)
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                throw new ApiError(401, 'Please login first (No token provided)');
            }

            const token = authHeader.split(" ")[1];

            // 2. Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
            
            // 3. Check user
            const user = await User.findOne({ _id: decoded.id });
            if (!user) throw new ApiError(401, 'Invalid or expired token');
            
            req.user = user;
            next();
        } catch (err: any) {
            // Catch JWT specific errors (like expired or malformed)
            throw new ApiError(401, err.message || 'Invalid or expired token');
        }
    };
};