/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */

/**
 * User Interface.
 * https://yandex.ru/dev/direct/doc/dg-v4/concepts/register.html?lang=en#oauth
 *
 * @interface
 */
export interface UserInterface {
  /**
   * Identifier.
   */
  id: number;

  /**
   * Full Name.
   */
  full_name?: string;

  /**
   * Email Address.
   */
  email: string;

  /**
   * Password.
   */
  password?: string;

  /**
   * List of available device IDs.
   */
  deviceIds: string[];
}
