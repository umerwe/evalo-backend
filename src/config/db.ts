import mongoose from 'mongoose';
import { config } from './env';

export const connectDB = async () => {
    const uri = config.dbKey;
    if (!uri) throw new Error("DB_KEY env variable is not set");

    if (mongoose.connection.readyState === 1) {
        console.log("✅ Already Connected");
        return;
    }

    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected");
};