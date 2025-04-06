import { decodeEnvironmentVariable, isBase64, plainTextVariables } from '../../../src/config/env-decoder.js';
import logger from '../../../src/utils/logger.js';

jest.mock('../../../src/utils/logger.js', () => ({
  warn: jest.fn()
}));

describe('Environment Decoder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('plainTextVariables should contain AWS_REGION', () => {
    expect(plainTextVariables).toContain('AWS_REGION');
  });

  test('decodeEnvironmentVariable should return undefined if value is undefined', () => {
    const result = decodeEnvironmentVariable('TEST_VAR', undefined);
    expect(result).toBeUndefined();
  });

  test('decodeEnvironmentVariable should return raw value if decode is false', () => {
    const result = decodeEnvironmentVariable('TEST_VAR', 'test-value', false);
    expect(result).toBe('test-value');
  });

  test('decodeEnvironmentVariable should return raw value if name is in plainTextVariables', () => {
    const result = decodeEnvironmentVariable('AWS_REGION', 'us-west-2', true);
    expect(result).toBe('us-west-2');
  });

  test('decodeEnvironmentVariable should decode base64 value', () => {
    // 'dGVzdC12YWx1ZQ==' is 'test-value' in base64
    const result = decodeEnvironmentVariable('TEST_VAR', 'dGVzdC12YWx1ZQ==', true);
    expect(result).toBe('test-value');
  });

  test('decodeEnvironmentVariable should return raw value if decode fails', () => {
    // Use a string that's guaranteed to fail decoding (not valid base64)
    const result = decodeEnvironmentVariable('TEST_VAR', '@@invalid@@', true);
    expect(result).toBe('@@invalid@@');
    expect(logger.warn).toHaveBeenCalled();
  });

  test('isBase64 should return false for null or undefined', () => {
    expect(isBase64(null)).toBe(false);
    expect(isBase64(undefined)).toBe(false);
  });

  test('isBase64 should return false for non-string value', () => {
    expect(isBase64(123)).toBe(false);
    expect(isBase64({})).toBe(false);
  });

  test('isBase64 should return false for string with invalid characters', () => {
    expect(isBase64('invalid!base64')).toBe(false);
  });

  test('isBase64 should return false for string with invalid length', () => {
    expect(isBase64('abc')).toBe(false); // Length not divisible by 4
  });

  test('isBase64 should return true for valid base64 string', () => {
    expect(isBase64('dGVzdA==')).toBe(true); // 'test' in base64
  });
});