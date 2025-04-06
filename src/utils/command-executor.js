/**
 * Utility to execute shell commands with proper error handling and timeout
 */
import { exec } from 'child_process';
import logger from './logger.js';

/**
 * Execute a shell command with timeout and output handling
 * @param {string} command - Command to execute
 * @param {number} timeout - Timeout in milliseconds
 * @param {Object} options - Additional options
 * @param {number} [options.maxBuffer=20971520] - Max stdout/stderr buffer size (default 20MB)
 * @returns {Promise<string>} - Command output
 * @throws {Error} - If command fails
 */
function executeCommand(command, timeout = 60000, options = {}) {
  const maxBuffer = options.maxBuffer || 20 * 1024 * 1024; // Default 20MB

  logger.info(`Executing: ${command}`);
  logger.debug(`Timeout: ${timeout}ms`);

  return new Promise((resolve, reject) => {
    // Execute command with timeout
    const childProcess = exec(command, {
      maxBuffer,
      timeout,
    });

    let stdoutChunks = [];
    let stderrChunks = [];

    // Capture stdout
    childProcess.stdout.on('data', (data) => {
      stdoutChunks.push(data);
      // Only log important progress updates to avoid flooding logs
      if (data.includes('%')) {
        const progressLine = data.toString().trim();
        if (progressLine.includes('100.0%') || progressLine.match(/\d{2}\.0%/)) {
          logger.info(`Progress: ${progressLine}`);
        }
      }
    });

    // Capture stderr
    childProcess.stderr.on('data', (data) => {
      stderrChunks.push(data);
      logger.error(`Error: ${data.toString().trim()}`);
    });

    // Handle process completion
    childProcess.on('close', (code) => {
      const stdout = stdoutChunks.join('');
      const stderr = stderrChunks.join('');

      if (code === 0) {
        logger.info(`Command completed successfully with exit code ${code}`);
        resolve(stdout);
      } else {
        const errorMessage = stderr || stdout || `Command failed with exit code ${code}`;
        logger.error(`Command failed with exit code ${code}: ${errorMessage}`);
        reject(new Error(`Command failed: ${errorMessage}`));
      }
    });

    // Handle process errors (e.g., command not found)
    childProcess.on('error', (error) => {
      logger.error(`Process error: ${error.message}`);
      reject(new Error(`Command execution error: ${error.message}`));
    });
  });
}

/**
 * Check if a command exists on the system
 * @param {string} command - Command to check
 * @returns {Promise<boolean>} - Whether the command exists
 */
async function commandExists(command) {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${command}` : `which ${command}`;

    await executeCommand(checkCmd, 5000);
    return true;
  } catch (error) {
    return false;
  }
}

export { executeCommand, commandExists };
