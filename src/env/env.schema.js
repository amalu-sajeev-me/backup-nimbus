const { z } = require('zod');

const envSchema = z.object({
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string(),
  AWS_S3_BUCKET_NAME: z.string().base64(),
  MONGO_URI: z.string().base64(),
});

module.exports = envSchema;