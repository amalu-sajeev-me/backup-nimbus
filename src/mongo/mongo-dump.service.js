/** @format */
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

/**
 * Execute MongoDB dump operation
 * @param {string} MONGO_URI - MongoDB connection URI
 * @param {Object} options - Configuration options
 * @param {string[]} [options.excludeCollections] - Collections to exclude
 * @param {number} [options.timeout=600000] - Timeout in milliseconds (10 minutes)
 * @returns {Promise<string>} - Path to the created archive
 * @throws {Error} - If dump operation fails
 */
function dumpMongoDB(MONGO_URI, options = {}) {
  // Validate inputs
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }
  
  // Default options
  const defaultOptions = {
    excludeCollections: [],
    timeout: 600000, // 10 minutes
  };
  
  const config = { ...defaultOptions, ...options };
  
  // Setup paths and filenames
  const MONGO_DUMP_PATH = 'mongodump';
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const archiveName = `atlas-backup-${timestamp}.gz`;
  const archivePath = path.join('/tmp', archiveName);
  
  // Build command parts
  const commandParts = [
    MONGO_DUMP_PATH,
    `--uri="${MONGO_URI}"`,
    `--archive=${archivePath}`,
    '--gzip',
    '--numParallelCollections=1',
    '--readPreference=secondary'
  ];
  
  // Add collection exclusions
  if (Array.isArray(config.excludeCollections) && config.excludeCollections.length > 0) {
    config.excludeCollections.forEach(collection => {
      commandParts.push(`--excludeCollection=${collection}`);
    });
  }
  
  // Join command parts
  const command = commandParts.join(' ');
  
  return new Promise((resolve, reject) => {
    console.log(`[MongoDB Dump] Starting backup at ${timestamp}`);
    console.log(`[MongoDB Dump] Excluding collections:`, config.excludeCollections);
    
    // Create a child process with timeout
    const childProcess = exec(command, { 
      maxBuffer: 20 * 1024 * 1024, // 20MB buffer
      timeout: config.timeout 
    });
    
    let stdoutData = '';
    let stderrData = '';
    
    // Setup output handling
    childProcess.stdout.on('data', (data) => {
      stdoutData += data;
      // Only log progress indicators occasionally to reduce log volume
      if (data.includes('%')) {
        console.log(`[MongoDB Dump] Progress: ${data.toString().trim()}`);
      }
    });
    
    childProcess.stderr.on('data', (data) => {
      stderrData += data;
      console.error(`[MongoDB Dump] Error: ${data.toString().trim()}`);
    });
    
    // Handle process completion
    childProcess.on('close', (code) => {
      if (code === 0) {
        // Verify the file was created and has content
        try {
          const stats = fs.statSync(archivePath);
          if (stats.size === 0) {
            return reject(new Error('MongoDB dump created an empty file'));
          }
          
          console.log(`[MongoDB Dump] Backup completed successfully at ${new Date().toISOString()}`);
          console.log(`[MongoDB Dump] Archive created at: ${archivePath} (${stats.size} bytes)`);
          return resolve(archivePath);
        } catch (error) {
          return reject(new Error(`MongoDB dump failed: File verification error: ${error.message}`));
        }
      } else {
        const errorMessage = stderrData || stdoutData || 'Unknown error during MongoDB dump';
        console.error(`[MongoDB Dump] Failed with exit code ${code}: ${errorMessage}`);
        return reject(new Error(`MongoDB dump failed with code ${code}: ${errorMessage}`));
      }
    });
    
    // Handle process errors
    childProcess.on('error', (error) => {
      console.error(`[MongoDB Dump] Process error: ${error.message}`);
      return reject(new Error(`MongoDB dump process error: ${error.message}`));
    });
  });
}

module.exports = {
  dumpMongoDB,
};