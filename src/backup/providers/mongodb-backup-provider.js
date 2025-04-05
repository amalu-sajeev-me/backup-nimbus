/**
 * MongoDB specific backup implementation
 */
import { BackupProvider } from './backup-provider.js';
import { buildMongoDumpCommand } from '../../mongo/command-builder.js';
import { executeCommand } from '../../utils/command-executor.js';
import path from 'path';

class MongoDBBackupProvider extends BackupProvider {
  constructor(config = {}) {
    super();
    this.config = {
      timeout: 600000,
      excludeCollections: [],
      ...config
    };
  }
  
  async createBackup(connectionString) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveName = `mongodb-backup-${timestamp}.gz`;
    const archivePath = path.join('/tmp', archiveName);
    
    const command = buildMongoDumpCommand(
      connectionString,
      archivePath,
      this.config
    );
    
    await executeCommand(command, this.config.timeout);
    return archivePath;
  }
}

export { MongoDBBackupProvider };