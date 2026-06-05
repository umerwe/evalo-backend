import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors';

import authRoute from './modules/auth/auth.routes';
import adminRoute from './modules/admin/admin.routes';
import evaluatorRoute from './modules/evaluator/evaluator.routes';
import teamRoute from './modules/team/team.routes';
import technicalSupportRoute from './modules/technicalSupport/technicalSupport.routes';
import resultRoute from './modules/result/result.routes';
import uploadRoute from './modules/upload/upload.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// middlewares
app.use(corsOptions);
app.use(cookieParser());
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true, limit: "4mb" }));

app.get("/favicon.ico", (req: Request, res: Response) => {
  res.status(204).end();
});

// routes
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/admin', adminRoute);
app.use('/api/v1/evaluator', evaluatorRoute);
app.use('/api/v1/team', teamRoute);
app.use('/api/v1/technical-support', technicalSupportRoute);
app.use('/api/v1/result', resultRoute);
app.use('/api/v1/upload', uploadRoute);

// health check
app.get("/", (req: Request, res: Response) => {
  res.send("Backend is running successfully 🚀");
});

// error handler
app.use(errorHandler);

export { app };
