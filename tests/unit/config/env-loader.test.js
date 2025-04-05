import { loadEnvironmentVariables } from '../../../src/config/env-loader.js';
import dotenv from 'dotenv';
import path from 'path';
import logger from '../../../src/utils/logger.js';

jest.mock('dotenv');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn()
}));
jest.mock('../../../src/utils/logger.js', () => ({
  warn: jest.fn()
}));

describe('Environment Loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock path.resolve to return a predictable path
    path.resolve.mockReturnValue('/path/to/.env');
    
    // Mock process.env
    process.env = {
      NODE_ENV: 'test',
      TEST_VAR: 'test-value'
    };
  });

  test('loadEnvironmentVariables should call dotenv.config with correct path', () => {
    // Mock dotenv.config to return success
    dotenv.config.mockReturnValue({ parsed: {} });
    
    const result = loadEnvironmentVariables();
    
    expect(dotenv.config).toHaveBeenCalledWith({
      path: '/path/to/.env'
    });
    
    expect(result).toEqual(process.env);
  });

  // Other tests remain the same...
});