/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */

/**
 * Export Capability.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/capability-types.html?lang=en
 *
 * @interface
 */
export interface Capability {
  /**
   * Type of capability.
   */
  type: string;

  /**
   * If it's possible to request the state of this device capability. Acceptable values:
   * - true: A state request is available for the capability. Default value.
   * - false: A state request is not available for the capability.
   */
  retrievable?: boolean;

  /**
   * Indicates that the notification service reports the capability state change. Acceptable values:
   * - true: Notification is enabled.
   * The manufacturer notifies Yandex Smart Home of every change in the capability state.
   * - false: Notification is disabled.
   * The manufacturer doesn't notify Yandex Smart Home of the capability state change. Default value.
   */
  reportable?: boolean;

  /**
   * The parameters object.
   */
  parameters?: CapabilityParameters;

  /**
   * Capability state parameters.
   */
  state?: CapabilityState;
}

/**
 * The parameters object.
 *
 * @interface
 */
export interface CapabilityParameters {}

/**
 * Capability state parameters.
 *
 * @interface
 */
export interface CapabilityState {
  /**
   * Function name for this capability.
   */
  instance: string;

  /**
   * Function value for this capability.
   */
  value?: any;

  /**
   * Result of changing the state of the device capability.
   */
  action_result?: CapabilityStateActionResult;
}

/**
 * Result of changing the state of the device capability.
 *
 * @interface
 */
export interface CapabilityStateActionResult {
  /**
   * Status of the device capability state change. Acceptable values:
   * - DONE: The state of the device capability state changed.
   * - ERROR: An error occurred when changing the state of the device capability.
   */
  status: CapabilityStateActionResultStatus;

  /**
   * An error code from the list of errors. If status:"ERROR", the parameter is required.
   */
  error_code?: string;

  /**
   * Extended human-readable description of a possible error.
   * It is displayed only in the Testing section of the developer console.
   */
  error_message?: string;
}

/**
 * Status of the device capability state change. Acceptable values:
 * - DONE: The state of the device capability state changed.
 * - ERROR: An error occurred when changing the state of the device capability.
 *
 * @type
 */
export type CapabilityStateActionResultStatus = 'DONE' | 'ERROR';
