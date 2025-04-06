/**
 * Responsible only for decoding environment variables
 */
import logger from '../utils/logger.js';

const plainTextVariables = ['AWS_REGION'];

function decodeEnvironmentVariable(name, value, decode = true) {
  if (!value) return undefined;

  if (decode && !plainTextVariables.includes(name)) {
    try {
      return Buffer.from(value, 'base64').toString('utf-8');
    } catch (error) {
      logger.warn(`Failed to decode ${name}, returning raw value`);
      logger.debug(`Error decoding ${name}: ${error.message}`);
      return value;
    }
  }

  return value;
}

function isBase64(str) {
  if (!str || typeof str !== 'string') return false;
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  return base64Regex.test(str) && str.length % 4 === 0;
}

export { decodeEnvironmentVariable, isBase64, plainTextVariables };
