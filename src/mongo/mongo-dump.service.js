/** @format */
const path = require('path');
const { exec } = require('child_process');
const { stdout } = require('process');


/**
 * 
 * @param {string} MONGO_URI 
 * @param {object} options Optional configuration
 * @returns {Promise<string>} The path to the archive file.
 */
function dumpMongoDB(MONGO_URI, options = {}) {
  const MONGO_DUMP_PATH = `mongodump`;
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const archiveName = `atlas-backup-${timestamp}.gz`;
  const archivePath = path.join('/tmp', archiveName);
  
  // Add optimizations for better performance and reliability
  const optimizedOptions = [
    `--uri="${MONGO_URI}"`, // Fix: Remove $ and {} to avoid template literal issues
    `--archive=${archivePath}`,
    '--gzip',
    // Add compatible optimization options
    '--numParallelCollections=1',   // Reduce parallel operations
    '--readPreference=secondary'    // Use secondary for reads when available
    // Removing the unsupported --batchSize parameter
  ];
  
  // Add collection filtering if needed
  if (options.excludeCollections && Array.isArray(options.excludeCollections)) {
    options.excludeCollections.forEach(collection => {
      optimizedOptions.push(`--excludeCollection=${collection}`);
    });
  }
  
  const CMD = `${MONGO_DUMP_PATH} ${optimizedOptions.join(' ')}`;
  
  return new Promise((resolve, reject) => {
    console.log(`Starting MongoDB dump: ${timestamp}`);
    console.log(`Executing command with optimized parameters`);
    
    const childProcess = exec(CMD, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`MongoDB dump failed: ${error.message}`);
        if (stderr) console.error(`stderr: ${stderr}`);
        return reject(new Error(`Failed to dump MongoDB: ${error.message}`));
      }
      
      console.log(`MongoDB dump completed successfully at ${new Date().toISOString()}`);
      console.log(`Archive created at: ${archivePath}`);
      return resolve(archivePath);
    });
    
    // Log progress
    childProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    childProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });
  });
}

module.exports = {
    dumpMongoDB,
}