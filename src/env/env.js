/**
 * @typedef {Object} Env
 * @property {string} [AWS_ACCESS_KEY_ID] - The AWS access key.
 * @property {string} [AWS_SECRET_ACCESS_KEY] - The AWS secret access key.
 * @property {string} [AWS_REGION] - The AWS region.
 * @property {string} [AWS_S3_BUCKET_NAME] - The AWS S3 bucket name.
 * @property {string} [MONGO_URI] - The MongoDB URI.
 */


/** @type {Env} */
let environmentVariables = process.env;


/**
 * 
 * @param {keyof Env} varName 
 * @param {boolean} decode64 
 * @returns {string | undefined}
 */
function getEnvironmentData(varName, decode64 = true) {
    console.log('getEnvironmentData called with:', varName, decode64);
    const env = environmentVariables[varName];
    
    if (!env) return undefined;
    
    if (decode64) {
        try {
            // Try to decode as base64
            return Buffer.from(env, 'base64').toString('utf-8');
        } catch (error) {
            // If decoding fails, return the original value
            console.warn(`Warning: Failed to decode ${varName} as base64, returning raw value`);
            return env;
        }
    }
    console.log('Returning environment variable:', env);
    return env;
}

global.IS_ENV_VALIDATED = false;

function validateEnvironmentData() {
    const envSchema = require('./env.schema.js');
    const { error, data } = envSchema.safeParse(environmentVariables);
    console.log('Environment variables:', data);
    console.log('Validation result:', error, data);
    if (error) {
        console.error('Environment variables validation failed:', error);
        throw new Error(`Environment variables validation failed: ${error.message}`);
    }
    environmentVariables = data;
    global.IS_ENV_VALIDATED = true;
    console.log('Environment variables validated successfully:');
    return global.IS_ENV_VALIDATED;
}


const moduleProxy = new Proxy(
    { getEnvironmentData, validateEnvironmentData },
    {
        get(target, prop) {
            if(global.IS_ENV_VALIDATED === false) {
                validateEnvironmentData();
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