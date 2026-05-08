import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';

export const createRoleBasedJWTMiddleware = () => {
    return async (req: any, res: any, next: any) => {
        try {
            const token = req.cookies?.token;
            if (!token) throw new ApiError(400, 'Please login first');

            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
            
            const user = await User.findOne({ _id: decoded.id });
            if (!user) throw new ApiError(401, 'Invalid or expired token');
            
            req.user = user;
            next();
        } catch (err: any) {
            throw new ApiError(401, 'Invalid or expired token');
        }
    };
};
