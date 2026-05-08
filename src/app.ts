import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

import authRoute from './routes/auth';
import adminRoute from './routes/admin';
import evaluatorRoute from './routes/evaluator';
import teamRoute from './routes/team';
import technicalSupportRoute from './routes/technicalSupport';
import resultStatus from './routes/result';

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/admin', adminRoute);
app.use('/api/v1/evaluator', evaluatorRoute);
app.use('/api/v1/team', teamRoute);
app.use('/api/v1/technical-support', technicalSupportRoute);
app.use('/api/v1/result', resultStatus);

app.get("/", (req: Request, res: Response) => {
  res.send("Backend is running successfully 🚀");
});


// ✅ Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export { app };
