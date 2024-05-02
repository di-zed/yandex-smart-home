/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Device } from './device';

/**
 * Export Devices Response.
 * https://yandex.ru/dev/dialogs/smart-home/doc/reference/get-devices.html?lang=en
 *
 * @interface
 */
export interface DevicesResponse {
  /**
   * Request ID.
   */
  request_id: string;

  /**
   * Object with devices.
   */
  payload: ResponsePayload;
}

/**
 * Object with devices.
 *
 * @interface
 */
export interface ResponsePayload {
  /**
   * User ID.
   */
  user_id?: string;

  /**
   * Array of the user's devices.
   */
  devices: Device[];
}
