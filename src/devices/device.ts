/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Capability } from './capability';
import { Property } from './property';

/**
 * Export Device.
 * https://yandex.ru/dev/dialogs/smart-home/doc/reference/get-devices.html?lang=en
 *
 * @interface
 */
export interface Device {
  /**
   * Device ID. It must be unique among all the manufacturer's devices.
   */
  id: string;

  /**
   * Device name.
   */
  name?: string;

  /**
   * Device description.
   */
  description?: string;

  /**
   * Name of the room where the device is located.
   */
  room?: string;

  /**
   * Device type.
   */
  type?: string;

  /**
   * An object consisting of a set of "key":"value" pairs with any nesting level,
   * providing additional information about the device. Object content size must not exceed 1024 bytes.
   * Yandex Smart Home saves this object and sends it in Information about the states of the user's devices
   * and Changing the state of devices requests.
   */
  custom_data?: object;

  /**
   * Array with information about device capabilities.
   */
  capabilities?: Capability[];

  /**
   * Array with information about the device's properties.
   */
  properties?: Property[];

  /**
   * Additional technical information about the device.
   */
  device_info?: DeviceInfo;

  /**
   * An error code from the list. If the field is filled in, the capabilities and properties parameters are ignored.
   */
  error_code?: string;

  /**
   * Extended human-readable description of a possible error.
   * Available only on the Testing tab of the developer console.
   */
  error_message?: string;
}

/**
 * Additional technical information about the device.
 *
 * @interface
 */
export interface DeviceInfo {
  /**
   * Name of the device manufacturer. It can contain up to 256 characters.
   */
  manufacturer: string;

  /**
   * Name of the device model. It can contain up to 256 characters.
   */
  model: string;

  /**
   * Device hardware version. It can contain up to 256 characters.
   */
  hw_version?: string;

  /**
   * Device software version. It can contain up to 256 characters.
   */
  sw_version?: string;
}
