/** @format */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { getEnvironmentData } = require('../env/env.js');


// Get bucket name from environment
const bucketName = getEnvironmentData('AWS_S3_BUCKET_NAME', true);
if (!bucketName) {
  throw new Error('AWS_S3_BUCKET_NAME environment variable is not set or invalid');
}

// Create S3 service with retry configuration
const s3 = new AWS.S3({
  maxRetries: 3,
  retryDelayOptions: { base: 1000 }
});

/**
 * Upload file to S3 bucket
 * @param {string} archivePath - Local path to the file
 * @param {Object} options - Upload options
 * @param {string} [options.contentType='application/gzip'] - Content type
 * @param {number} [options.maxRetries=3] - Maximum number of retries
 * @returns {Promise<AWS.S3.PutObjectOutput>} - S3 response
 * @throws {Error} - If upload fails
 */
async function uploadToS3(archivePath, options = {}) {
  console.log(`[S3 Upload] Starting upload of ${archivePath}`);
  
  // Validate inputs
  if (!archivePath) {
    throw new Error('Archive path is required');
  }
  
  if (!bucketName) {
    throw new Error('S3 bucket name is not configured');
  }
  
  // Check if file exists
  try {
    if (!fs.existsSync(archivePath)) {
      throw new Error(`File not found: ${archivePath}`);
    }
    
    const stats = fs.statSync(archivePath);
    if (stats.size === 0) {
      throw new Error(`File is empty: ${archivePath}`);
    }
    
    console.log(`[S3 Upload] File size: ${stats.size} bytes`);
  } catch (error) {
    console.error(`[S3 Upload] File validation error: ${error.message}`);
    throw error;
  }
  
  // Prepare upload
  const fileName = path.basename(archivePath);
  const fileContent = fs.readFileSync(archivePath);
  
  // Set default options
  const defaultOptions = {
    contentType: 'application/gzip',
    maxRetries: 3
  };
  
  const config = { ...defaultOptions, ...options };
  
  // Configure upload parameters
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileContent,
    ContentType: config.contentType
  };
  
  // Implement retry logic
  let attempt = 0;
  const maxAttempts = config.maxRetries + 1;
  
  while (attempt < maxAttempts) {
    attempt++;
    try {
      console.log(`[S3 Upload] Attempt ${attempt}/${maxAttempts} to upload ${fileName}`);
      const response = await s3.putObject(params).promise();
      console.log(`[S3 Upload] Successfully uploaded to ${bucketName}/${fileName}`);
      return response;
    } catch (error) {
      console.error(`[S3 Upload] Attempt ${attempt} failed: ${error.message}`);
      
      // Check if we should retry
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`[S3 Upload] Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`[S3 Upload] All ${maxAttempts} attempts failed.`);
        throw new Error(`Failed to upload to S3 after ${maxAttempts} attempts: ${error.message}`);
      }
    }
  }
}

module.exports = {
  uploadToS3,
};
