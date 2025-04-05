/** @format */
const { dumpMongoDB } = require('./mongo/mongo-dump.service.js');
const { uploadToS3 } = require('./aws/s3.service.js');
const { getEnvironmentData, validateEnvironmentData } = require('./env/env.js');
const fs = require('fs');

/**
 * Main handler function for backup operation
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context
 * @returns {Promise<Object>} - Response object
 */
const handler = async (event, context) => {
  console.log('[Handler] Starting backup operation');
  console.log('[Handler] Event:', JSON.stringify(event, null, 2));
  
  let archivePath;
  
  try {
    // Ensure environment variables are valid
    validateEnvironmentData();
    
    // Get MongoDB URI
    const mongoUri = getEnvironmentData('MONGO_URI');
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is missing or invalid');
    }
    
    // Step 1: Perform MongoDB dump
    console.log('[Handler] Starting MongoDB dump operation');
    archivePath = await dumpMongoDB(mongoUri, {
      // Skip large collections to improve performance
      excludeCollections: ['zipcodes'],
      // Set timeout to slightly less than Lambda timeout to ensure proper cleanup
      timeout: 840000, // 14 minutes (assuming Lambda timeout is 15 min)
    });
    
    // Step 2: Upload to S3
    console.log('[Handler] Starting S3 upload operation');
    const response = await uploadToS3(archivePath, {
      maxRetries: 3,
    });
    
    console.log('[Handler] Backup operation completed successfully');
    return formatResponse(200, {
      message: 'MongoDB backup and upload to S3 completed successfully',
      archivePath,
    });
  } catch (error) {
    console.error('[Handler] Error:', error.message);
    
    // Log full error details for debugging
    console.error('[Handler] Full error:', error);
    
    return formatResponse(500, {
      message: 'Backup operation failed',
      error: error.message,
    });
  } finally {
    // Cleanup: Remove temporary file regardless of success/failure
    if (archivePath) {
      try {
        if (fs.existsSync(archivePath)) {
          fs.unlinkSync(archivePath);
          console.log(`[Handler] Cleaned up temporary file: ${archivePath}`);
        }
      } catch (cleanupError) {
        console.error(`[Handler] Failed to clean up file: ${cleanupError.message}`);
      }
    }
  }
};

/**
 * Format response for API Gateway
 * @param {number} statusCode - HTTP status code
 * @param {Object} body - Response body
 * @returns {Object} - Formatted response
 */
function formatResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

module.exports = { handler };
