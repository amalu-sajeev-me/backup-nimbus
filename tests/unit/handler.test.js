import { handler } from '../../src/handler.js';
import { EnvironmentConfigProvider } from '../../src/config/providers/environment-config-provider.js';
import { MongoDBBackupProvider } from '../../src/backup/providers/mongodb-backup-provider.js';
import { S3StorageProvider } from '../../src/storage/providers/s3-storage-provider.js';
import { BackupService } from '../../src/backup/backup-service.js';
import fs from 'fs';
import logger from '../../src/utils/logger.js';

// Mock all dependencies
jest.mock('../../src/config/providers/environment-config-provider.js', () => ({
  EnvironmentConfigProvider: jest.fn().mockImplementation(() => ({
    get: jest.fn(key => {
      if (key === 'MONGO_URI') return 'mongodb://test';
      if (key === 'AWS_S3_BUCKET_NAME') return 'test-bucket';
      return null;
    })
  }))
}));

jest.mock('../../src/backup/providers/mongodb-backup-provider.js', () => ({
  MongoDBBackupProvider: jest.fn().mockImplementation(() => ({
    createBackup: jest.fn().mockResolvedValue('/tmp/test-backup.gz')
  }))
}));

jest.mock('../../src/storage/providers/s3-storage-provider.js', () => ({
  S3StorageProvider: jest.fn().mockImplementation(() => ({
    uploadFile: jest.fn().mockResolvedValue({ key: 'test-backup.gz' })
  }))
}));

jest.mock('../../src/backup/backup-service.js', () => ({
  BackupService: jest.fn().mockImplementation(() => ({
    performBackup: jest.fn().mockResolvedValue('/tmp/test-backup.gz')
  }))
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  unlinkSync: jest.fn()
}));

jest.mock('../../src/utils/logger.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Handler', () => {
  const mockBackupPath = '/tmp/test-backup.gz';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock EnvironmentConfigProvider
    EnvironmentConfigProvider.mockImplementation(() => ({
      get: jest.fn().mockImplementation(key => {
        if (key === 'MONGO_URI') return 'mongodb://test';
        if (key === 'AWS_S3_BUCKET_NAME') return 'test-bucket';
        return null;
      })
    }));
    
    // Mock MongoDBBackupProvider
    MongoDBBackupProvider.mockImplementation(() => ({
      createBackup: jest.fn()
    }));
    
    // Mock S3StorageProvider
    S3StorageProvider.mockImplementation(() => ({
      uploadFile: jest.fn()
    }));
    
    // Mock BackupService
    BackupService.mockImplementation(() => ({
      performBackup: jest.fn().mockResolvedValue(mockBackupPath)
    }));
    
    // Mock fs
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockImplementation(() => {});
  });
  
  test('handler should create providers with correct parameters', async () => {
    await handler();
    
    // Check EnvironmentConfigProvider was instantiated
    expect(EnvironmentConfigProvider).toHaveBeenCalledTimes(1);
    
    // Check MongoDBBackupProvider was instantiated with correct options
    expect(MongoDBBackupProvider).toHaveBeenCalledWith({
      timeout: 840000,
      excludeCollections: ['zipcodes']
    });
    
    // Check S3StorageProvider was instantiated with correct options
    expect(S3StorageProvider).toHaveBeenCalledWith('test-bucket', {
      maxRetries: 3,
      retryDelayBase: 1000
    });
    
    // Check BackupService was instantiated with providers
    expect(BackupService).toHaveBeenCalledTimes(1);
  });
  
  test('handler should perform backup and return success response', async () => {
    const result = await handler();
    
    // Check BackupService.performBackup was called
    const backupServiceInstance = BackupService.mock.instances[0];
    expect(backupServiceInstance.performBackup).toHaveBeenCalled();
    
    // Check success response
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Backup completed successfully',
        backupFile: mockBackupPath
      })
    });
    
    // Check log messages
    expect(logger.info).toHaveBeenCalledWith('Starting backup process');
    expect(logger.info).toHaveBeenCalledWith('Backup completed successfully');
    
    // Check cleanup
    expect(fs.existsSync).toHaveBeenCalledWith(mockBackupPath);
    expect(fs.unlinkSync).toHaveBeenCalledWith(mockBackupPath);
    expect(logger.info).toHaveBeenCalledWith(`Temporary file removed: ${mockBackupPath}`);
  });
  
  test('handler should handle errors and return error response', async () => {
    // Make BackupService.performBackup fail
    const testError = new Error('Backup failed');
    BackupService.mockImplementation(() => ({
      performBackup: jest.fn().mockRejectedValue(testError)
    }));
    
    const result = await handler();
    
    // Check error response
    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({
        message: 'Backup operation failed',
        error: 'Backup failed'
      })
    });
    
    // Check log messages
    expect(logger.error).toHaveBeenCalledWith('Backup failed:', 'Backup failed');
    
    // Check no cleanup was attempted (no path)
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });
  
  test('handler should handle cleanup when file does not exist', async () => {
    // Make fs.existsSync return false
    fs.existsSync.mockReturnValue(false);
    
    await handler();
    
    // Check fs.existsSync was called but not fs.unlinkSync
    expect(fs.existsSync).toHaveBeenCalledWith(mockBackupPath);
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });
  
  test('handler should pass event and context to backup service', async () => {
    const mockEvent = { source: 'aws.events' };
    const mockContext = { functionName: 'backupFunction' };
    
    await handler(mockEvent, mockContext);
    
    // Should still work correctly with event and context
    expect(BackupService).toHaveBeenCalledTimes(1);
    const backupServiceInstance = BackupService.mock.instances[0];
    expect(backupServiceInstance.performBackup).toHaveBeenCalled();
  });

  test('handler should complete successfully', async () => {
    const result = await handler();
    
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).message).toBe('Backup completed successfully');
  });
});