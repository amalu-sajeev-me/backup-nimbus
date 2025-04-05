import { StorageProvider } from '../../../../src/storage/providers/storage-provider.js';

describe('StorageProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new StorageProvider();
  });

  test('uploadFile should throw "not implemented" error', async () => {
    await expect(provider.uploadFile('/path/to/file')).rejects.toThrow('Method not implemented');
  });

  test('deleteFile should throw "not implemented" error', async () => {
    await expect(provider.deleteFile('file-key')).rejects.toThrow('Method not implemented');
  });

  test('listFiles should throw "not implemented" error', async () => {
    await expect(provider.listFiles()).rejects.toThrow('Method not implemented');
  });

  test('listFiles should accept prefix parameter', async () => {
    await expect(provider.listFiles('backup/')).rejects.toThrow('Method not implemented');
  });
});