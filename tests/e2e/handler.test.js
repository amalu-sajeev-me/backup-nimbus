import { handler } from '../../src/handler.js';
import { EnvironmentConfigProvider } from '../../src/config/providers/environment-config-provider.js';
import { MongoDBBackupProvider } from '../../src/backup/providers/mongodb-backup-provider.js';
import { S3StorageProvider } from '../../src/storage/providers/s3-storage-provider.js';
import fs from 'fs';

// Mock dependencies
jest.mock('../../src/config/providers/environment-config-provider.js');
jest.mock('../../src/backup/providers/mongodb-backup-provider.js');
jest.mock('../../src/storage/providers/s3-storage-provider.js');
jest.mock('fs');

jest.mock('../../src/backup/backup-service.js', () => ({
  BackupService: jest.fn().mockImplementation(() => ({
    performBackup: jest.fn().mockResolvedValue('/tmp/test-backup.gz')
  }))
}));

describe('Handler End-to-End Tests', () => {
  let mockBackupPath = '/tmp/test-backup.gz';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup environment config mock
    EnvironmentConfigProvider.mockImplementation(() => ({
      get: jest.fn().mockImplementation(key => {
        if (key === 'MONGO_URI') return 'mongodb://test';
        if (key === 'AWS_S3_BUCKET_NAME') return 'test-bucket';
        return null;
      })
    }));
    
    // Setup backup provider mock
    MongoDBBackupProvider.mockImplementation(() => ({
      createBackup: jest.fn().mockResolvedValue(mockBackupPath)
    }));
    
    // Setup storage provider mock
    S3StorageProvider.mockImplementation(() => ({
      uploadFile: jest.fn().mockResolvedValue({ key: 'test-backup.gz' })
    }));
    
    // Setup fs mock
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockImplementation(() => {});
  });

  test('handler should complete the backup process successfully', async () => {
    const result = await handler();
    
    // Check result
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Backup completed successfully',
        backupFile: mockBackupPath
      })
    });
    
    // Verify file cleanup
    expect(fs.existsSync).toHaveBeenCalledWith(mockBackupPath);
    expect(fs.unlinkSync).toHaveBeenCalledWith(mockBackupPath);
  });

  test('handler should return error status when backup fails', async () => {
    const testError = new Error('Test backup failure');
    
    // Override implementation to throw
    MongoDBBackupProvider.mockImplementation(() => ({
      createBackup: jest.fn().mockRejectedValue(testError)
    }));
    
    const result = await handler();
    
    // Check result contains error
    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({
        message: 'Backup operation failed',
        error: 'Test backup failure'
      })
    });
    
    // Verify no cleanup was attempted (no file was created)
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });
});

describe('Handler E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
  });

  test('full backup flow should work end-to-end', async () => {
    const result = await handler();
    
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).message).toBe('Backup completed successfully');
  });
});