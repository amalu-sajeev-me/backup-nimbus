/** @format */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { getEnvironmentData } = require('../env/env.js');
const bucketName = getEnvironmentData('AWS_S3_BUCKET_NAME', true);

const s3 = new AWS.S3();

/**
 * 
 * @param {string} archivePath 
 * @returns {Promise<AWS.S3.PutObjectOutput>}
 */
async function uploadToS3(archivePath) {
  console.log('Uploading to S3...');
  if (!fs.existsSync(archivePath)) {
    throw new Error(`File not found: ${archivePath}`);
  }
  try {
    const Body = fs.readFileSync(archivePath);
    const fileName = path.basename(archivePath);
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: Body,
    };
    const { $response } = await s3.putObject(params).promise();
    console.log('Successfully uploaded data to ' + bucketName + '/' + fileName);
    return $response;
  } catch (error) {
    console.error(`Error uploading to S3: ${error.message}`);
    throw error;
  }
}

module.exports = {
  uploadToS3,
};
