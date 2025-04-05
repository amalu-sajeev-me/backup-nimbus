/**
 * Responsible only for loading environment variables
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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