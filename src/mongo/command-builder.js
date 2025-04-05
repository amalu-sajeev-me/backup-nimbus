/**
 * Responsible for building mongodump commands
 */
function buildMongoDumpCommand(uri, outputPath, options = {}) {
  const commandParts = [
    'mongodump',
    `--uri="${uri}"`,
    `--archive=${outputPath}`,
    '--gzip',
    '--numParallelCollections=2',
    '--readPreference=secondary'
  ];
  
  if (options.excludeCollections?.length > 0) {
    options.excludeCollections.forEach(collection => {
      commandParts.push(`--excludeCollection=${collection}`);
    });
  }
  
  return commandParts.join(' ');
}

export { buildMongoDumpCommand };