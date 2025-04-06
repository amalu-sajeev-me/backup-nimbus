/**
 * Abstract backup provider interface
 */
class BackupProvider {
  async createBackup(options) {
    throw new Error('Method not implemented');
  }

  getProviderName() {
    return this.constructor.name;
  }
}

export { BackupProvider };
