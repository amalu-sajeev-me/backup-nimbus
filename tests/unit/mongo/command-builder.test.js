import { buildMongoDumpCommand } from '../../../src/mongo/command-builder.js';

describe('Command Builder', () => {
  test('should build basic mongodump command', () => {
    const uri = 'mongodb://localhost:27017/test';
    const outputPath = '/tmp/backup.gz';
    
    const command = buildMongoDumpCommand(uri, outputPath);
    
    expect(command).toContain('mongodump');
    expect(command).toContain(`--uri="${uri}"`);
    expect(command).toContain(`--archive=${outputPath}`);
    expect(command).toContain('--gzip');
    expect(command).toContain('--numParallelCollections=2');
    expect(command).toContain('--readPreference=secondary');
  });
  
  test('should include exclude collections if provided', () => {
    const uri = 'mongodb://localhost:27017/test';
    const outputPath = '/tmp/backup.gz';
    const options = {
      excludeCollections: ['logs', 'audit']
    };
    
    const command = buildMongoDumpCommand(uri, outputPath, options);
    
    expect(command).toContain('--excludeCollection=logs');
    expect(command).toContain('--excludeCollection=audit');
  });
  
  test('should handle empty excludeCollections array', () => {
    const uri = 'mongodb://localhost:27017/test';
    const outputPath = '/tmp/backup.gz';
    const options = {
      excludeCollections: []
    };
    
    const command = buildMongoDumpCommand(uri, outputPath, options);
    
    expect(command).not.toContain('--excludeCollection=');
  });
});