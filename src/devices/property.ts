/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */

/**
 * Export Property.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/properties-types.html?lang=en
 *
 * @interface
 */
export interface Property {
  /**
   * Property type.
   */
  type: string;

  /**
   * Whether it's possible to request the state of the device property. Acceptable values:
   * - true: A state request is available for the property. Default value.
   *-  false: A state request is not available for the property. The value is available if reportable:true.
   */
  retrievable?: boolean;

  /**
   * Whether the property reports the state change to Yandex Smart Home using the notification service.
   * Acceptable values:
   * - true: Notification is enabled. The manufacturer notifies Yandex Smart Home of every property state change.
   * - false: Notification is disabled. The manufacturer doesn't notify Yandex Smart Home of the property state change.
   * Default value.
   */
  reportable?: boolean;

  /**
   * The parameters object.
   */
  parameters?: PropertyParameters;

  /**
   * Property state parameters.
   */
  state?: PropertyState;
}

/**
 * The parameters object.
 *
 * @interface
 */
export interface PropertyParameters {}

/**
 * Property state parameters.
 *
 * @interface
 */
export interface PropertyState {
  /**
   * Function name for a property.
   */
  instance: string;

  /**
   * Property value for this capability.
   */
  value: any;
}
