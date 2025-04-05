import { BackupService } from '../../src/backup/backup-service.js';
import { BackupProvider } from '../../src/backup/providers/backup-provider.js';
import { StorageProvider } from '../../src/storage/providers/storage-provider.js';
import { ConfigProvider } from '../../src/config/providers/config-provider.js';

// Custom mock implementations
class MockBackupProvider extends BackupProvider {
  constructor() {
    super();
    this.createBackupMock = jest.fn().mockResolvedValue('/tmp/test-backup.gz');
  }

  async createBackup(connectionString) {
    return this.createBackupMock(connectionString);
  }

  getProviderName() {
    return 'MockBackupProvider';
  }
}

class MockStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.uploadFileMock = jest.fn().mockResolvedValue({ key: 'test-backup.gz' });
  }

  async uploadFile(filePath) {
    return this.uploadFileMock(filePath);
  }
}

class MockConfigProvider extends ConfigProvider {
  constructor(config = {}) {
    super();
    this.config = {
      'MONGO_URI': 'mongodb://test:password@localhost:27017/test',
      ...config
    };
  }

  get(key) {
    return this.config[key];
  }

  has(key) {
    return key in this.config;
  }
}

describe('Backup Service Integration Tests', () => {
  let backupProvider;
  let storageProvider;
  let configProvider;
  let backupService;

  beforeEach(() => {
    backupProvider = new MockBackupProvider();
    storageProvider = new MockStorageProvider();
    configProvider = new MockConfigProvider();
    backupService = new BackupService(backupProvider, storageProvider, configProvider);
  });

  test('performBackup should orchestrate the full backup flow', async () => {
    const result = await backupService.performBackup();

    // Check that the connection string was retrieved from config
    expect(configProvider.config['MONGO_URI']).toBe('mongodb://test:password@localhost:27017/test');

    // Check that backup was created with correct connection string
    expect(backupProvider.createBackupMock).toHaveBeenCalledWith('mongodb://test:password@localhost:27017/test');

    // Check that the backup file was uploaded
    expect(storageProvider.uploadFileMock).toHaveBeenCalledWith('/tmp/test-backup.gz');

    // Check the result
    expect(result).toBe('/tmp/test-backup.gz');
  });

  test('performBackup should throw error when connection string is missing', async () => {
    configProvider = new MockConfigProvider({ 'MONGO_URI': undefined });
    backupService = new BackupService(backupProvider, storageProvider, configProvider);

    await expect(backupService.performBackup()).rejects.toThrow('Database connection string not found');
    
    // Verify no backup was attempted
    expect(backupProvider.createBackupMock).not.toHaveBeenCalled();
    expect(storageProvider.uploadFileMock).not.toHaveBeenCalled();
  });
});