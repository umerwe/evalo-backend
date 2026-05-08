import jwt, { SignOptions } from "jsonwebtoken";

export const generateToken = (id: string) => {
    return jwt.sign(
        {
            _id: id
        },
        process.env.TOKEN_SECRET as string,
        {
            expiresIn: process.env.TOKEN_EXPIRY as SignOptions["expiresIn"]
        }
    )
} 