import 'dotenv/config';
import dotenv from 'dotenv';
import { app } from './app';
import { connectDB } from './config/db';
import { config } from './config/env';
import './jobs/cleanupOrphans';

dotenv.config();

const PORT = config.port || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on PORT: ${PORT}`);
        });
    })
    .catch((error) => {
        console.log(`Error: ${error}`);
    });
