/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */

/**
 * Registry Interface.
 */
export default class Registry {
  /**
   * The cached data.
   */
  protected data: { [key: string]: any } = {};

  /**
   * Set the value.
   *
   * @param key
   * @param value
   * @returns boolean
   */
  public set(key: string, value: any): boolean {
    this.data[key] = value;
    return true;
  }

  /**
   * Get the value.
   *
   * @param key
   * @returns any
   */
  public get(key: string): any {
    return this.data[key];
  }

  /**
   * Delete the value.
   *
   * @param key
   * @returns boolean
   */
  public delete(key: string): boolean {
    if (this.get(key)) {
      delete this.data[key];
      return true;
    }

    return false;
  }

  /**
   * Delete all values.
   *
   * @returns boolean
   */
  public deleteAll(): boolean {
    this.data = {};
    return true;
  }
}
