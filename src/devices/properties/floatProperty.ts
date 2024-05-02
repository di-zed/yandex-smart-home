/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Property, PropertyParameters, PropertyState } from '../property';

/**
 * Export "float" property.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/float.html?lang=en
 *
 * @interface
 */
export interface FloatProperty extends Property {
  /**
   *	Property type.
   */
  readonly type: 'devices.properties.float';

  /**
   * The parameters object.
   */
  parameters?: FloatPropertyParameters;

  /**
   * Property state parameters.
   */
  state?: FloatPropertyState;
}

/**
 * The parameters object.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/float.html?lang=en#discovery
 *
 * @interface
 */
export interface FloatPropertyParameters extends PropertyParameters {
  /**
   * 	Function name for a property.
   */
  instance: FloatPropertyInstance;

  /**
   * Function value units.
   */
  unit: FloatPropertyInstanceUnit;
}

/**
 * Property state parameters.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/float.html?lang=en#state
 *
 * @interface
 */
export interface FloatPropertyState extends PropertyState {
  /**
   * Function name for a property.
   */
  instance: FloatPropertyInstance;

  /**
   * Property value for this capability.
   */
  value: number;
}

/**
 * List of functions.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/float-instance.html?lang=en
 *
 * @type
 */
export type FloatPropertyInstance =
  | 'amperage' // Displays the current amperage.
  | 'battery_level' // Displays the battery level.
  | 'co2_level' // Displays the carbon dioxide level readings.
  | 'food_level' // Displays the food level readings.
  | 'humidity' // Displays the humidity readings.
  | 'illumination' // Displays the illumination level.
  | 'pm1_density' // Displays the level of air pollution with PM1 particles.
  | 'pm2.5_density' // Displays the level of air pollution with PM2.5 particles.
  | 'pm10_density' // Displays the level of air pollution with PM10 particles.
  | 'power' // Displays the current power consumption.
  | 'pressure' // Pressure display.
  | 'temperature' // Displays the temperature readings.
  | 'tvoc' // Displays the level of organic compounds in the air.
  | 'voltage' // Displays the current voltage.
  | 'water_level'; // Displays the water level readings.

/**
 * List of units.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/float-instance.html?lang=en
 *
 * @type
 */
export type FloatPropertyInstanceUnit =
  | 'unit.ampere'
  | 'unit.percent'
  | 'unit.ppm'
  | 'unit.illumination.lux'
  | 'unit.density.mcg_m3'
  | 'unit.watt'
  | 'unit.pressure.atm'
  | 'unit.pressure.pascal'
  | 'unit.pressure.bar'
  | 'unit.pressure.mmhg'
  | 'unit.temperature.celsius'
  | 'unit.temperature.kelvin'
  | 'unit.volt';
