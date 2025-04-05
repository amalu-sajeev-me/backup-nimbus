import { BackupProvider } from '../../../../src/backup/providers/backup-provider.js';

describe('BackupProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new BackupProvider();
  });

  test('createBackup should throw "not implemented" error', async () => {
    await expect(provider.createBackup()).rejects.toThrow('Method not implemented');
  });

  test('getProviderName should return constructor name', () => {
    expect(provider.getProviderName()).toBe('BackupProvider');
  });
});