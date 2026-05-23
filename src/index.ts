import 'dotenv/config';
import { app } from './app';
import { connectDB } from './config/db';
import { config } from './config/env';

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