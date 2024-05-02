/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { ConfigInterface } from '../interfaces/configInterface';

/**
 * Config Provider.
 */
class ConfigProvider {
  /**
   * Config Interface.
   *
   * @protected
   */
  protected config: ConfigInterface | undefined;

  /**
   * Set configurations.
   *
   * @param config
   * @returns ConfigProvider
   */
  public setConfig(config: ConfigInterface): ConfigProvider {
    this.config = config;
    return this;
  }

  /**
   * Get configurations.
   *
   * @returns ConfigInterface | undefined
   */
  public getConfig(): ConfigInterface | undefined {
    return this.config;
  }

  /**
   * Get configuration option.
   *
   * @param key
   * @returns any
   */
  public getConfigOption(key: string): any {
    const config: ConfigInterface | undefined = this.getConfig();
    if (config !== undefined) {
      return config[key];
    }
    return undefined;
  }
}

export default new ConfigProvider();
