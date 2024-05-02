/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */

/**
 * Client Interface.
 * https://yandex.ru/dev/direct/doc/dg-v4/concepts/register.html?lang=en#oauth
 *
 * @interface
 */
export interface ClientInterface {
  /**
   * Identifier.
   */
  id: number;

  /**
   * Application ID.
   */
  client_id: string;

  /**
   * Application Secret.
   */
  client_secret: string;
}
