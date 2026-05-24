import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req);
  if (!result.success) {
    const message = result.error.issues[0].message;
    return next(new ApiError(400, message));
  }
  next();
};