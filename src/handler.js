import { EnvironmentConfigProvider } from './config/providers/environment-config-provider.js';
import { MongoDBBackupProvider } from './backup/providers/mongodb-backup-provider.js';
import { S3StorageProvider } from './storage/providers/s3-storage-provider.js';
import { BackupService } from './backup/backup-service.js';
import logger from './utils/logger.js';
import fs from 'fs';

/**
 * Main application handler using dependency injection
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context
 * @returns {Promise<Object>} - Response object
 */
const handler = async (event, context) => {
  // Setup dependencies
  const configProvider = new EnvironmentConfigProvider();
  
  const backupProvider = new MongoDBBackupProvider({
    timeout: 840000,
    excludeCollections: ['zipcodes']
  });
  
  const bucketName = configProvider.get('AWS_S3_BUCKET_NAME');
  const storageProvider = new S3StorageProvider(bucketName, {
    maxRetries: 3,
    retryDelayBase: 1000
  });
  
  // Create service with dependencies
  const backupService = new BackupService(backupProvider, storageProvider, configProvider);
  
  let backupPath;
  try {
    logger.info('Starting backup process');
    backupPath = await backupService.performBackup();
    
    logger.info('Backup completed successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Backup completed successfully',
        backupFile: backupPath
      })
    };
  } catch (error) {
    logger.error('Backup failed:', error.message);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Backup operation failed',
        error: error.message
      })
    };
  } finally {
    // Cleanup
    if (backupPath && fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      logger.info(`Temporary file removed: ${backupPath}`);
    }
  }
};

export { handler };
