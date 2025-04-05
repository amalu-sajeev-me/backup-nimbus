/**
 * Abstract storage provider interface
 */
class StorageProvider {
  async uploadFile(filePath, options = {}) {
    throw new Error('Method not implemented');
  }
  
  async deleteFile(fileIdentifier) {
    throw new Error('Method not implemented');
  }
  
  async listFiles(prefix = '') {
    throw new Error('Method not implemented');
  }
}

export { StorageProvider };