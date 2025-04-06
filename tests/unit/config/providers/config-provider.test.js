import { ConfigProvider } from '../../../../src/config/providers/config-provider.js';

describe('ConfigProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new ConfigProvider();
  });

  test('get should throw "not implemented" error', () => {
    expect(() => provider.get('key')).toThrow('Method not implemented');
  });

  test('has should throw "not implemented" error', () => {
    expect(() => provider.has('key')).toThrow('Method not implemented');
  });
});