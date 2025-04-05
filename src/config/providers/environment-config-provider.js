/**
 * Environment variable implementation of ConfigProvider
 */
import { ConfigProvider } from './config-provider.js';
import { loadEnvironmentVariables } from '../env-loader.js';
import { decodeEnvironmentVariable } from '../env-decoder.js';

class EnvironmentConfigProvider extends ConfigProvider {
  constructor() {
    super();
    this.variables = loadEnvironmentVariables();
    this.cache = new Map();
  }
  
  get(key, decode = true) {
    const cacheKey = `${key}:${decode}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const value = decodeEnvironmentVariable(key, this.variables[key], decode);
    this.cache.set(cacheKey, value);
    return value;
  }
  
  has(key) {
    return !!this.variables[key];
  }
}

export { EnvironmentConfigProvider };