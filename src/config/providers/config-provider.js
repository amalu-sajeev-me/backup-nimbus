/**
 * Interface for retrieving configuration
 */
class ConfigProvider {
  get(key) {
    throw new Error('Method not implemented');
  }
  
  has(key) {
    throw new Error('Method not implemented');
  }
}

export { ConfigProvider };