import mongoose from 'mongoose';

let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } =
    (global as any).mongooseCache || { conn: null, promise: null };

(global as any).mongooseCache = cached;

export const connectDB = async () => {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        const uri = process.env.DB_KEY;
        if (!uri) throw new Error("DB_KEY env variable is not set");

        cached.promise = mongoose
            .connect(uri, { bufferCommands: false })
            .then((m) => {
                console.log("✅ MongoDB Connected");
                return m;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null;
        throw err;
    }

    return cached.conn;
};
