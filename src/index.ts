import 'dotenv/config';
import { app } from './app';
import { connectDB } from './db';

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on PORT: ${PORT}`);
        });
    })
    .catch((error) => {
        console.log(`Error: ${error}`);
    });