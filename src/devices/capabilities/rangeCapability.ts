/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Capability, CapabilityParameters, CapabilityState } from '../capability';

/**
 * Export "range" capability.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/range.html?lang=en
 *
 * @interface
 */
export interface RangeCapability extends Capability {
  /**
   * Type of capability.
   */
  readonly type: 'devices.capabilities.range';

  /**
   * The parameters object.
   */
  parameters?: RangeCapabilityParameters;

  /**
   * Capability state parameters.
   */
  state?: RangeCapabilityState;
}

/**
 * The parameters object.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/range.html?lang=en#discovery
 *
 * @interface
 */
export interface RangeCapabilityParameters extends CapabilityParameters {
  /**
   * Function name for this capability.
   */
  instance: RangeCapabilityInstance;

  /**
   * Function value units.
   */
  unit?: RangeCapabilityInstanceUnit;

  /**
   * Setting arbitrary function values.
   * If this feature is disabled, the user can only change the values gradually, either up or down.
   * For example, turning the TV volume up or down via an IR remote.
   * Acceptable values:
   * - true: Setting arbitrary values is enabled.
   * - false: The feature is disabled.
   * Default value: true.
   */
  random_access?: boolean;

  /**
   * Object that describes the range of function values.
   */
  range?: RangeCapabilityParametersRange;
}

/**
 * Object that describes the range of function values.
 */
export interface RangeCapabilityParametersRange {
  /**
   * Minimum acceptable value. The value varies depending on the function of the skill.
   */
  min?: number;

  /**
   * Maximum acceptable value. The value varies depending on the capability function.
   */
  max?: number;

  /**
   * The minimum step between values in the range. The default value is 1.
   */
  precision?: number;
}

/**
 * Capability state parameters.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/range.html?lang=en#state
 *
 * @interface
 */
export interface RangeCapabilityState extends CapabilityState {
  /**
   * Function name for this capability.
   */
  readonly instance: RangeCapabilityInstance;

  /**
   * Function value for this capability.
   */
  value: number;

  /**
   * The method to calculate the function value for the skill.
   * - true: The new function value is calculated from the current value by incrementing it by value.
   * - false: The skill function is set to value.
   * Default value: false.
   */
  relative?: boolean;
}

/**
 * List of functions.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/range-instance.html?lang=en
 *
 * @type
 */
export type RangeCapabilityInstance = 'brightness' | 'channel' | 'humidity' | 'open' | 'temperature' | 'volume';

/**
 * Function value units.
 *
 * @type
 */
export type RangeCapabilityInstanceUnit = 'unit.percent' | 'unit.temperature.celsius' | 'unit.temperature.kelvin';
