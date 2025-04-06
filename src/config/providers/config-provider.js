/**
 * Interface for retrieving configuration
 */
class ConfigProvider {
  get(_key) {
    throw new Error('Method not implemented');
  }

  has(_key) {
    throw new Error('Method not implemented');
  }
}

export { ConfigProvider };
