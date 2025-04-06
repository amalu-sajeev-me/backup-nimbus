/**
 * S3 implementation of storage provider
 */
import { StorageProvider } from './storage-provider.js';
import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

class S3StorageProvider extends StorageProvider {
  constructor(bucketName, config = {}) {
    super();
    this.bucketName = bucketName;

    this.s3 = new AWS.S3({
      maxRetries: config.maxRetries || 3,
      retryDelayOptions: { base: config.retryDelayBase || 1000 },
    });
  }

  async uploadFile(filePath, options = {}) {
    const fileName = path.basename(filePath);
    const fileStream = fs.createReadStream(filePath);

    const params = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileStream,
      ContentType: options.contentType || 'application/gzip',
    };

    return this.s3.upload(params).promise();
  }

  async deleteFile(key) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
    };

    return this.s3.deleteObject(params).promise();
  }

  async listFiles(prefix = '') {
    const params = {
      Bucket: this.bucketName,
      Prefix: prefix,
    };

    return this.s3.listObjectsV2(params).promise();
  }
}

export { S3StorageProvider };
