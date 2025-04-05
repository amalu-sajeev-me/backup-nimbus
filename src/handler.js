/** @format */

const { dumpMongoDB } = require('./mongo/mongo-dump.service.js');
const { uploadToS3 } = require('./aws/s3.service.js');
const { getEnvironmentData } = require('./env/env.js');
const dotenv = require('dotenv');

const handler = async () => {
  dotenv.config();
  try {
    console.log('Starting MongoDB backup and upload to S3...');
    const mongoUri = getEnvironmentData('MONGO_URI');
    console.log({ mongoUri });
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }
    console.log('starting MongoDB dump...', mongoUri);
    const archivePath = await dumpMongoDB(mongoUri, {
      excludeCollections: ['zipcodes',],
    });
    console.log(`MongoDB dump completed: ${archivePath}`);
    await uploadToS3(archivePath);
    console.log(`Successfully uploaded to S3: ${archivePath}`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'MongoDB backup and upload to S3 completed successfully.',
        archivePath,
      }),
    };
  } catch (error) {
    
    console.error(`Error in handler: ${error.message}`);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error.message,
      }),
    };
  }
};

module.exports = { handler };
