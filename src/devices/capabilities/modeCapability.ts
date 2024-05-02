/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Capability, CapabilityParameters, CapabilityState } from '../capability';

/**
 * Export "mode" capability.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/mode.html?lang=en
 *
 * @interface
 */
export interface ModeCapability extends Capability {
  /**
   * Type of capability.
   */
  readonly type: 'devices.capabilities.mode';

  /**
   * The parameters object.
   */
  parameters?: ModeCapabilityParameters;

  /**
   * Capability state parameters.
   */
  state?: ModeCapabilityState;
}

/**
 * The parameters object.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/mode.html?lang=en#discovery
 *
 * @interface
 */
export interface ModeCapabilityParameters extends CapabilityParameters {
  /**
   * Function name for this capability.
   */
  instance: ModeCapabilityInstance;

  /**
   * The array of mode objects describing the function's modes. Minimum number of modes in the array: 1.
   */
  modes: ModeCapabilityParametersMode[];
}

/**
 * The array of mode objects describing the function's modes. Minimum number of modes in the array: 1.
 */
export interface ModeCapabilityParametersMode {
  /**
   * The value of the function operating mode processed on the provider side.
   */
  value: string;
}

/**
 * Capability state parameters.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/mode.html?lang=en#state
 *
 * @interface
 */
export interface ModeCapabilityState extends CapabilityState {
  /**
   * Function name for this capability.
   */
  readonly instance: ModeCapabilityInstance;

  /**
   * The value of the function operating mode processed on the provider side.
   */
  value: string;
}

/**
 * List of functions.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/mode-instance.html?lang=en
 *
 * @type
 */
export type ModeCapabilityInstance =
  | 'cleanup_mode'
  | 'coffee_mode'
  | 'dishwashing'
  | 'fan_speed'
  | 'heat'
  | 'input_source'
  | 'program'
  | 'swing'
  | 'tea_mode'
  | 'thermostat'
  | 'work_speed';
