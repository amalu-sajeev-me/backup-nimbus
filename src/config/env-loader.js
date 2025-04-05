/**
 * Responsible only for loading environment variables
 */
import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger.js';

// Use process.cwd() instead which works in both normal and test environments
function loadEnvironmentVariables() {
  const result = dotenv.config({ 
    path: path.resolve(process.cwd(), '.env') 
  });
  
  if (result.error) {
    logger.warn('Environment file not found or cannot be parsed');
  }
  
  return process.env;
}

export { loadEnvironmentVariables };