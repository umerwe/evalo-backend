import 'dotenv/config';

export const config = {
    port: process.env.PORT || 5000,
    dbKey: process.env.DB_KEY,
    jwtSecret: process.env.JWT_SECRET,
    clientUrl: process.env.CLIENT_URL,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsRegion: process.env.AWS_REGION,
    awsBucketName: process.env.AWS_BUCKET_NAME,
    nodeEnv: process.env.NODE_ENV || "development",
};
