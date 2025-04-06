import { S3StorageProvider } from '../../../../src/storage/providers/s3-storage-provider.js';
import AWS from 'aws-sdk';
import AWSMock from 'aws-sdk-mock';
import fs from 'fs';
import path from 'path';

jest.mock('fs');

describe('S3StorageProvider', () => {
  const testBucketName = 'test-bucket';
  const testFilePath = '/tmp/test-backup.gz';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fs.createReadStream
    fs.createReadStream.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      pipe: jest.fn().mockReturnThis()
    });
    
    // Mock AWS S3 methods
    AWSMock.setSDKInstance(AWS);
  });
  
  afterEach(() => {
    AWSMock.restore('S3');
  });

  test('constructor should initialize with default config', () => {
    const provider = new S3StorageProvider(testBucketName);
    expect(provider.bucketName).toBe(testBucketName);
    expect(provider.s3).toBeDefined();
  });

  test('constructor should accept custom config', () => {
    const provider = new S3StorageProvider(testBucketName, {
      maxRetries: 5,
      retryDelayBase: 2000
    });
    expect(provider.s3.config.maxRetries).toBe(5);
  });

  test('uploadFile should upload file to S3', async () => {
    // Mock S3 upload
    AWSMock.mock('S3', 'upload', (params, callback) => {
      expect(params.Bucket).toBe(testBucketName);
      expect(params.Key).toBe('test-backup.gz');
      expect(params.ContentType).toBe('application/gzip');
      callback(null, { Location: 'https://test-bucket.s3.amazonaws.com/test-backup.gz' });
    });
    
    const provider = new S3StorageProvider(testBucketName);
    const result = await provider.uploadFile(testFilePath);
    
    expect(fs.createReadStream).toHaveBeenCalledWith(testFilePath);
    expect(result).toEqual({ Location: 'https://test-bucket.s3.amazonaws.com/test-backup.gz' });
  });

  test('uploadFile should use custom content type if provided', async () => {
    // Mock S3 upload
    AWSMock.mock('S3', 'upload', (params, callback) => {
      expect(params.ContentType).toBe('application/octet-stream');
      callback(null, { Location: 'https://test-bucket.s3.amazonaws.com/test-backup.gz' });
    });
    
    const provider = new S3StorageProvider(testBucketName);
    await provider.uploadFile(testFilePath, { contentType: 'application/octet-stream' });
  });

  test('deleteFile should delete file from S3', async () => {
    // Mock S3 deleteObject
    AWSMock.mock('S3', 'deleteObject', (params, callback) => {
      expect(params.Bucket).toBe(testBucketName);
      expect(params.Key).toBe('test-backup.gz');
      callback(null, { DeleteMarker: true });
    });
    
    const provider = new S3StorageProvider(testBucketName);
    const result = await provider.deleteFile('test-backup.gz');
    
    expect(result).toEqual({ DeleteMarker: true });
  });

  test('listFiles should list files in S3 bucket with default empty prefix', async () => {
    const mockFiles = {
      Contents: [
        { Key: 'backup-1.gz', Size: 1024, LastModified: new Date() },
        { Key: 'backup-2.gz', Size: 2048, LastModified: new Date() }
      ]
    };
    
    // Mock S3 listObjectsV2
    AWSMock.mock('S3', 'listObjectsV2', (params, callback) => {
      expect(params.Bucket).toBe(testBucketName);
      expect(params.Prefix).toBe('');
      callback(null, mockFiles);
    });
    
    const provider = new S3StorageProvider(testBucketName);
    const result = await provider.listFiles();
    
    expect(result).toEqual(mockFiles);
  });

  test('listFiles should list files in S3 bucket with custom prefix', async () => {
    const mockFiles = {
      Contents: [
        { Key: 'backup/backup-1.gz', Size: 1024, LastModified: new Date() },
        { Key: 'backup/backup-2.gz', Size: 2048, LastModified: new Date() }
      ]
    };
    
    // Mock S3 listObjectsV2
    AWSMock.mock('S3', 'listObjectsV2', (params, callback) => {
      expect(params.Bucket).toBe(testBucketName);
      expect(params.Prefix).toBe('backup');
      callback(null, mockFiles);
    });
    
    const provider = new S3StorageProvider(testBucketName);
    const result = await provider.listFiles('backup');
    
    expect(result).toEqual(mockFiles);
  });
});