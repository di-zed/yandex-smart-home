/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Capability, CapabilityParameters, CapabilityState } from '../capability';

/**
 * Export "color_setting" capability.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/color_setting.html?lang=en
 *
 * @interface
 */
export interface ColorSettingCapability extends Capability {
  /**
   * Type of capability.
   */
  readonly type: 'devices.capabilities.color_setting';

  /**
   * The parameters object.
   */
  parameters?: ColorSettingCapabilityParameters;

  /**
   * Capability state parameters.
   */
  state?: ColorSettingCapabilityState;
}

/**
 * The parameters object.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/color_setting.html?lang=en#discovery
 *
 * @interface
 */
export interface ColorSettingCapabilityParameters extends CapabilityParameters {
  /**
   * Custom change of the color of device lighting elements. Acceptable values:
   * - hsv: Change color according to the HSV model.
   * - rgb: Change color according to the RGB model. The value must be in the 24-bit format (TrueColor).
   */
  color_model?: string;

  /**
   * Change in color temperature in kelvins. The range is specified in the additional "min" and "max" fields.
   * The default range is 2000—9000K.
   */
  temperature_k?: ColorSettingCapabilityTemperatureK;

  /**
   * Changing the operating mode of the device lighting elements according to the preset lighting themes and scenarios.
   */
  color_scene?: {
    /**
     * An array of scene objects that describe lighting themes and scenarios.
     * Minimum number of elements in the array: 1.
     */
    scenes: ColorSettingCapabilityScene[];
  };
}

/**
 * Capability state parameters.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/color_setting.html?lang=en#state
 *
 * @interface
 */
export interface ColorSettingCapabilityState extends CapabilityState {
  /**
   * Function name for this capability. Acceptable values:
   * - hsv: change color according to the HSV model.
   * - rgb: Change color according to the RGB model.
   * - temperature_k: Change color temperature in kelvins.
   * - scene: Change lighting themes and scenarios.
   */
  readonly instance: ColorSettingCapabilityInstance;

  /**
   * Function value for this capability. The format depends on the instance parameter value. Acceptable values:
   * - If "instance": "rgb", then the value passes the color value in the [0; 16777215] range based on the RGB model.
   * - If "instance": "temperature_k", then the color temperature in kelvins is passed in the value.
   * - If "instance": "hsv", then the additional parameters such as h, s, and v are passed in the value.
   * - If "instance": "scene", the value includes the names of the current lighting themes (scenarios) as strings.
   */
  value: string | number | ColorSettingCapabilityStateValueHsv;
}

/**
 * Change in color temperature in kelvins. The range is specified in the additional "min" and "max" fields.
 * The default range is 2000—9000K.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/color_setting.html?lang=en#discovery__parameters
 *
 * @type
 */
export type ColorSettingCapabilityTemperatureK = {
  min: number;
  max: number;
};

/**
 * Lighting themes and scenarios.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/color_setting.html?lang=en#discovery__parameters
 *
 * @type
 */
export type ColorSettingCapabilityScene = {
  id: ColorSettingCapabilitySceneId;
};

/**
 * Lighting scenario ID.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/color_setting.html?lang=en#discovery__parameters
 *
 * @type
 */
export type ColorSettingCapabilitySceneId =
  | 'alarm'
  | 'alice'
  | 'candle'
  | 'dinner'
  | 'fantasy'
  | 'garland'
  | 'jungle'
  | 'movie'
  | 'neon'
  | 'night'
  | 'ocean'
  | 'party'
  | 'reading'
  | 'rest'
  | 'romance'
  | 'siren'
  | 'sunrise'
  | 'sunset';

/**
 * Function name for this capability. Acceptable values:
 * - hsv: change color according to the HSV model.
 * - rgb: Change color according to the RGB model.
 * - temperature_k: Change color temperature in kelvins.
 * - scene: Change lighting themes and scenarios.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/color_setting.html?lang=en#state__parameters_0
 *
 * @type
 */
export type ColorSettingCapabilityInstance = 'hsv' | 'rgb' | 'temperature_k' | 'scene';

/**
 * The additional parameters such as "h", "s", and "v" are passed in the value.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/color_setting.html?lang=en#state__parameters_0
 *
 * @type
 */
export type ColorSettingCapabilityStateValueHsv = {
  /**
   * The hue varies in the range [0; 360] degrees.
   */
  h: number;

  /**
   * 	The saturation varies in the range [0; 100].
   */
  s: number;

  /**
   * 	Color value or brightness (value), changes in the range [0; 100].
   */
  v: number;
};
