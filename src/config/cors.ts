import cors from "cors";
import { config } from "./env";

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/$/, "");

const configuredOrigins = [
  config.clientUrl,
  "https://evalo-two.vercel.app",
  "http://localhost:3000",
]
  .filter(Boolean)
  .flatMap((origins) => origins!.split(","))
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOrigins = Array.from(new Set(configuredOrigins));

export const corsOptions = cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn(
      `CORS blocked origin: ${origin}. Allowed origins: ${allowedOrigins.join(", ")}`
    );
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
