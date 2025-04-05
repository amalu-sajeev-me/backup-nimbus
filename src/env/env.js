/**
 * @typedef {Object} Env
 * @property {string} [AWS_ACCESS_KEY_ID] - The AWS access key.
 * @property {string} [AWS_SECRET_ACCESS_KEY] - The AWS secret access key.
 * @property {string} [AWS_REGION] - The AWS region.
 * @property {string} [AWS_S3_BUCKET_NAME] - The AWS S3 bucket name.
 * @property {string} [MONGO_URI] - The MongoDB URI.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
const result = dotenv.config({ 
    path: path.resolve(process.cwd(), '.env') 
});

if (result.error) {
    console.warn('Warning: .env file not found or cannot be parsed');
}

/** @type {Env} */
let environmentVariables = process.env;

/**
 * Get environment variable with optional base64 decoding
 * @param {keyof Env} varName - Environment variable name
 * @param {boolean} decode64 - Whether to decode from base64
 * @returns {string | undefined} - The environment variable value
 * @throws {Error} - If the environment variable is required but not found
 */
function getEnvironmentData(varName, decode64 = true) {
    const env = environmentVariables[varName];
    
    if (!env) {
        console.warn(`Environment variable ${varName} not found`);
        return undefined;
    }
    
    // Skip base64 decoding for certain variables that are stored as plaintext
    const plainTextVariables = ['AWS_REGION'];
    if (decode64 && !plainTextVariables.includes(varName)) {
        try {
            return Buffer.from(env, 'base64').toString('utf-8');
        } catch (error) {
            console.warn(`Warning: Failed to decode ${varName} as base64, returning raw value`);
            return env;
        }
    }
    
    return env;
}

// Validation state
global.IS_ENV_VALIDATED = false;

/**
 * Validate environment variables against schema
 * @returns {boolean} - True if validation succeeded
 * @throws {Error} - If validation fails
 */
function validateEnvironmentData() {
    if (global.IS_ENV_VALIDATED) {
        return true;
    }
    
    try {
        const envSchema = require('./env.schema.js');
        
        // Create a copy for validation to avoid modifying original
        const envToValidate = { ...environmentVariables };
        
        // Handle special cases for validation
        if (envToValidate.AWS_REGION && !isBase64(envToValidate.AWS_REGION)) {
            envToValidate.AWS_REGION = Buffer.from(envToValidate.AWS_REGION).toString('base64');
        }
        
        const { error, data } = envSchema.safeParse(envToValidate);
        
        if (error) {
            const formattedError = formatZodError(error);
            throw new Error(`Environment validation failed: ${formattedError}`);
        }
        
        // Set the validated environment variables
        environmentVariables = data;
        global.IS_ENV_VALIDATED = true;
        return true;
    } catch (error) {
        console.error('Environment validation error:', error.message);
        throw error;
    }
}

/**
 * Format Zod error for better readability
 * @param {Error} error - Zod error object
 * @returns {string} - Formatted error message
 */
function formatZodError(error) {
    try {
        return error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
        ).join('; ');
    } catch (e) {
        return error.message;
    }
}

/**
 * Check if a string is base64 encoded
 * @param {string} str - String to check
 * @returns {boolean} - True if the string is base64 encoded
 */
function isBase64(str) {
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    return base64Regex.test(str) && str.length % 4 === 0;
}

// Create a proxy for lazy validation
const moduleProxy = new Proxy(
    { getEnvironmentData, validateEnvironmentData },
    {
        get(target, prop) {
            // Validate on first access
            if (global.IS_ENV_VALIDATED === false) {
                try {
                    validateEnvironmentData();
                } catch (error) {
                    console.error('Environment validation failed:', error.message);
                    throw error;
                }
            }
            
            if (prop in target) {
                return target[prop];
            } else {
                throw new Error(`Property ${String(prop)} does not exist on the module`);
            }
        },
    }
);

module.exports = moduleProxy;