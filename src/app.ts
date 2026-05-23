import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import "./jobs/cleanupOrphans";
import { corsOptions } from './config/cors';

dotenv.config();

const app = express();

app.use(corsOptions);

app.use(cookieParser());
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true, limit: "4mb" }));

import authRoute from './routes/auth';
import adminRoute from './routes/admin';
import evaluatorRoute from './routes/evaluator';
import teamRoute from './routes/team';
import technicalSupportRoute from './routes/technicalSupport';
import resultStatus from './routes/result';
import uploadRoute from './routes/upload.route';
import { config } from './config/env';

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/admin', adminRoute);
app.use('/api/v1/evaluator', evaluatorRoute);
app.use('/api/v1/team', teamRoute);
app.use('/api/v1/technical-support', technicalSupportRoute);
app.use('/api/v1/result', resultStatus);
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
