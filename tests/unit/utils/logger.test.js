import logger from '../../../src/utils/logger.js';

describe('Logger', () => {
  let originalConsoleLog;
  let originalConsoleWarn;
  let originalConsoleError;
  let mockConsoleLog;
  let mockConsoleWarn;
  let mockConsoleError;

  beforeEach(() => {
    // Save original console methods
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;

    // Create mocks
    mockConsoleLog = jest.fn();
    mockConsoleWarn = jest.fn();
    mockConsoleError = jest.fn();

    // Replace console methods with mocks
    console.log = mockConsoleLog;
    console.warn = mockConsoleWarn;
    console.error = mockConsoleError;
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  test('info should log message with INFO prefix', () => {
    logger.info('Test message');
    expect(mockConsoleLog).toHaveBeenCalledWith('[INFO] Test message');
  });

  test('warn should log message with WARN prefix', () => {
    logger.warn('Test warning');
    expect(mockConsoleWarn).toHaveBeenCalledWith('[WARN] Test warning');
  });

  test('error should log message with ERROR prefix', () => {
    logger.error('Test error');
    expect(mockConsoleError).toHaveBeenCalledWith('[ERROR] Test error');
  });

  test('debug should not log when DEBUG env var is not set', () => {
    const originalEnv = process.env.DEBUG;
    // Use delete instead of setting to undefined
    delete process.env.DEBUG;
    
    logger.debug('Test debug message');
    expect(mockConsoleLog).not.toHaveBeenCalled();
    
    process.env.DEBUG = originalEnv;
  });

  test('debug should log when DEBUG env var is set', () => {
    const originalEnv = process.env.DEBUG;
    process.env.DEBUG = 'true';
    
    logger.debug('Test debug message');
    expect(mockConsoleLog).toHaveBeenCalledWith('[DEBUG] Test debug message');
    
    process.env.DEBUG = originalEnv;
  });
});