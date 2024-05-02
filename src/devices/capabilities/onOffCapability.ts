/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Capability, CapabilityParameters, CapabilityState } from '../capability';

/**
 * Export "on_off" capability.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/on_off.html?lang=en
 *
 * @interface
 */
export interface OnOffCapability extends Capability {
  /**
   * Type of capability.
   */
  readonly type: 'devices.capabilities.on_off';

  /**
   * The parameters object.
   */
  parameters?: OnOffCapabilityParameters;

  /**
   * Capability state parameters.
   */
  state?: OnOffCapabilityState;
}

/**
 * The parameters object.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/on_off.html?lang=en#discovery
 *
 * @interface
 */
export interface OnOffCapabilityParameters extends CapabilityParameters {
  /**
   * This parameter is used with retrievable:false and shows that the provider uses different commands to turn on
   * and off the device. On the  Alice app home screen, the turn-on settings will be shown for all supported devices.
   * Acceptable values:
   * - true: Different commands are used to turn the device on and off.
   * - false: One command is used to turn the device on and off. Default value.
   */
  split?: boolean;
}

/**
 * Capability state parameters.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/on_off.html?lang=en#state
 *
 * @interface
 */
export interface OnOffCapabilityState extends CapabilityState {
  /**
   * Function name for this capability. Acceptable values:
   * - on: Remotely turn a device on and off.
   */
  readonly instance: 'on';

  /**
   * Function value for this capability. Acceptable values:
   * - true: the device is on.
   * - false: the device is off.
   */
  value: boolean;
}
