import { EnvironmentConfigProvider } from '../../../../src/config/providers/environment-config-provider.js';

// Directly mock the dependent modules
jest.mock('../../../../src/config/env-loader.js', () => ({
  loadEnvironmentVariables: jest.fn().mockReturnValue({
    TEST_VAR: 'test_value',
    ENCODED_VAR: 'encoded_value'
  })
}));

jest.mock('../../../../src/config/env-decoder.js', () => ({
  decodeEnvironmentVariable: jest.fn().mockImplementation((name, value, decode) => {
    if (name === 'ENCODED_VAR' && decode) {
      return 'decoded_value';
    }
    return value;
  })
}));

describe('EnvironmentConfigProvider', () => {
  let provider;
  
  beforeEach(() => {
    jest.clearAllMocks();
    provider = new EnvironmentConfigProvider();
  });

  test('get should return environment variable value', () => {
    // Setup a simple cache for testing
    provider.cache = new Map();
    provider.variables = { TEST_VAR: 'test_value' };
    
    const value = provider.get('TEST_VAR');
    expect(value).toBe('test_value');
  });

  test('has should return true when variable exists', () => {
    provider.variables = { TEST_VAR: 'test_value' };
    expect(provider.has('TEST_VAR')).toBe(true);
  });

  test('has should return false when variable does not exist', () => {
    provider.variables = { TEST_VAR: 'test_value' };
    expect(provider.has('NON_EXISTENT_VAR')).toBe(false);
  });
});