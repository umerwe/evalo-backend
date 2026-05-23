import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { corsOptions } from './config/cors';

dotenv.config();

const app = express();

app.use(corsOptions);

app.use(cookieParser());
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true, limit: "4mb" }));

import authRoute from './modules/auth/auth.routes';
import adminRoute from './modules/admin/admin.routes';
import evaluatorRoute from './modules/evaluator/evaluator.routes';
import teamRoute from './modules/team/team.routes';
import technicalSupportRoute from './modules/technicalSupport/technicalSupport.routes';
import resultRoute from './modules/result/result.routes';
import uploadRoute from './modules/upload/upload.routes';
import { config } from './config/env';

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/admin', adminRoute);
app.use('/api/v1/evaluator', evaluatorRoute);
app.use('/api/v1/team', teamRoute);
app.use('/api/v1/technical-support', technicalSupportRoute);
app.use('/api/v1/result', resultRoute);
app.use('/api/v1/upload', uploadRoute);

app.get("/", (req: Request, res: Response) => {
  res.send("Backend is running successfully 🚀");
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    stack: config.nodeEnv === "development" ? err.stack : undefined,
  });
});

export { app };
