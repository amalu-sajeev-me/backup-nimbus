/**
 * Abstract storage provider interface
 */
class StorageProvider {
  async uploadFile(filePath, _options = {}) {
    throw new Error('Method not implemented');
  }

  async deleteFile(_fileIdentifier) {
    throw new Error('Method not implemented');
  }

  async listFiles(_prefix = '') {
    throw new Error('Method not implemented');
  }
}

export { StorageProvider };
