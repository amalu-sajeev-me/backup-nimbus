import { MongoDBBackupProvider } from '../../../../src/backup/providers/mongodb-backup-provider.js';
import * as commandBuilder from '../../../../src/mongo/command-builder.js';
import * as commandExecutor from '../../../../src/utils/command-executor.js';
import path from 'path';

jest.mock('../../../../src/mongo/command-builder.js');
jest.mock('../../../../src/utils/command-executor.js');

describe('MongoDBBackupProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the date for consistent testing
    jest.spyOn(global.Date.prototype, 'toISOString').mockImplementation(() => '2025-04-06T12:00:00.000Z');
    
    // Setup mocks
    commandBuilder.buildMongoDumpCommand.mockReturnValue('mock mongodump command');
    commandExecutor.executeCommand.mockResolvedValue('command output');
  });

  afterEach(() => {
    // Restore Date
    jest.restoreAllMocks();
  });

  test('constructor should set default config', () => {
    const provider = new MongoDBBackupProvider();
    expect(provider.config).toEqual({
      timeout: 600000,
      excludeCollections: []
    });
  });

  test('constructor should merge provided config with defaults', () => {
    const provider = new MongoDBBackupProvider({
      timeout: 900000,
      excludeCollections: ['logs'],
      additionalOption: 'value'
    });
    
    expect(provider.config).toEqual({
      timeout: 900000,
      excludeCollections: ['logs'],
      additionalOption: 'value'
    });
  });

  test('createBackup should build and execute mongodump command', async () => {
    const provider = new MongoDBBackupProvider();
    const connectionString = 'mongodb://localhost:27017/test';
    
    const expectedArchivePath = path.join('/tmp', 'mongodb-backup-2025-04-06T12-00-00-000Z.gz');
    
    const result = await provider.createBackup(connectionString);
    
    expect(commandBuilder.buildMongoDumpCommand).toHaveBeenCalledWith(
      connectionString,
      expectedArchivePath,
      provider.config
    );
    
    expect(commandExecutor.executeCommand).toHaveBeenCalledWith(
      'mock mongodump command',
      600000
    );
    
    expect(result).toBe(expectedArchivePath);
  });

  test('createBackup should pass timeout from config', async () => {
    const provider = new MongoDBBackupProvider({ timeout: 900000 });
    const connectionString = 'mongodb://localhost:27017/test';
    
    await provider.createBackup(connectionString);
    
    expect(commandExecutor.executeCommand).toHaveBeenCalledWith(
      'mock mongodump command',
      900000
    );
  });
});