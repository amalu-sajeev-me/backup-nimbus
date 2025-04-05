/**
 * @typedef {import('./providers/backup-provider.js').BackupProvider} BackupProvider
 * @typedef {import('../storage/providers/storage-provider.js').StorageProvider} StorageProvider
 * @typedef {import('../config/providers/config-provider.js').ConfigProvider} ConfigProvider
 */
import logger from '../utils/logger.js';

class BackupService {
  /** @type {BackupProvider} */
  #backupProvider;

  /** @type {StorageProvider} */
  #storageProvider;

  /** @type {ConfigProvider} */
  #configProvider;

  /**
   * Creates a new BackupService instance.
   * @param {BackupProvider} backupProvider - Provider responsible for creating backups
   * @param {StorageProvider} storageProvider - Provider responsible for storing backups
   * @param {ConfigProvider} configProvider - Provider for accessing configuration
   */
  constructor(backupProvider, storageProvider, configProvider) {
    this.#backupProvider = backupProvider;
    this.#storageProvider = storageProvider;
    this.#configProvider = configProvider;
  }

  /**
   * Performs a backup operation.
   * - Retrieves the database connection string from the configuration provider.
   * - Creates a backup using the backup provider.
   * - Uploads the backup file to the storage provider.
   * @throws {Error} If the database connection string is not found.
   * @returns {Promise<string>} A Promise that resolves to the path of the created backup file.
   */
  async performBackup() {
    const connectionString = this.#configProvider.get('MONGO_URI');
    if (!connectionString) {
      throw new Error('Database connection string not found');
    }

    logger.info(`Starting backup with ${this.#backupProvider.getProviderName()}`);
    const backupPath = await this.#backupProvider.createBackup(connectionString);

    logger.info(`Uploading backup file to storage`);
    await this.#storageProvider.uploadFile(backupPath);

    logger.info(`Backup completed successfully`);
    return backupPath;
  }
}

export { BackupService };