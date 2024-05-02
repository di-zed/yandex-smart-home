/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Capability, CapabilityParameters, CapabilityState } from '../capability';

/**
 * Export "toggle" capability.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/toggle.html?lang=en
 *
 * @interface
 */
export interface ToggleCapability extends Capability {
  /**
   * Type of capability.
   */
  readonly type: 'devices.capabilities.toggle';

  /**
   * The parameters object.
   */
  parameters?: ToggleCapabilityParameters;

  /**
   * Capability state parameters.
   */
  state?: ToggleCapabilityState;
}

/**
 * The parameters object.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/toggle.html?lang=en#discovery
 *
 * @interface
 */
export interface ToggleCapabilityParameters extends CapabilityParameters {
  /**
   * Function name for this capability.
   */
  instance: ToggleCapabilityInstance;
}

/**
 * Capability state parameters.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/toggle.html?lang=en#state
 *
 * @interface
 */
export interface ToggleCapabilityState extends CapabilityState {
  /**
   * Function name for this capability.
   */
  readonly instance: ToggleCapabilityInstance;

  /**
   * Function value for this capability. Acceptable values:
   * - true: The function is enabled.
   * - false: The function is disabled.
   */
  value: boolean;
}

/**
 * List of functions.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/toggle-instance.html?lang=en
 *
 * @type
 */
export type ToggleCapabilityInstance = 'backlight' | 'controls_locked' | 'ionization' | 'keep_warm' | 'mute' | 'oscillation' | 'pause';
