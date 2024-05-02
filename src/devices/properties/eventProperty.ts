/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Property, PropertyParameters, PropertyState } from '../property';

/**
 * Export "event" property.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/event.html?lang=en
 *
 * @interface
 */
export interface EventProperty extends Property {
  /**
   *	Property type.
   */
  readonly type: 'devices.properties.event';

  /**
   * The parameters object.
   */
  parameters?: EventPropertyParameters;

  /**
   * Property state parameters.
   */
  state?: EventPropertyState;
}

/**
 * The parameters object.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/event.html?lang=en#discovery
 *
 * @interface
 */
export interface EventPropertyParameters extends PropertyParameters {
  /**
   * 	Function name for a property.
   */
  instance: EventPropertyInstance;

  /**
   * Array of event objects that describe events supported by the property. Minimum number of events in the array: 1.
   */
  events: EventPropertyEvent[];
}

/**
 * Property state parameters.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/event.html?lang=en#state
 *
 * @interface
 */
export interface EventPropertyState extends PropertyState {
  /**
   * Function name for the property.
   */
  instance: EventPropertyInstance;

  /**
   * Property value for this capability.
   */
  value: EventPropertyEventValue;
}

/**
 * List of functions.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/event-instance.html?lang=en
 *
 * @type
 */
export type EventPropertyInstance =
  | 'vibration' // Displaying events of physical interaction: vibrating, falling, tilting.
  | 'open' // Displaying events for opening/closing doors, windows, and so on.
  | 'button' // Displaying button click events.
  | 'motion' // Displaying events relating to movement detection in the sensor range.
  | 'smoke' // Displaying smoke detection events in the room.
  | 'gas' // Displaying gas detection events in the room.
  | 'battery_level' // Displaying battery charge events.
  | 'food_level' // Displaying events related to the pet food level.
  | 'water_level' // Displaying events relating to the water level.
  | 'water_leak'; // Displaying water leak events.

/**
 * Event object.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/event-instance.html?lang=en
 *
 * @type
 */
export type EventPropertyEvent = {
  value: EventPropertyEventValue;
};

/**
 * List of event values.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/event-instance.html?lang=en
 *
 * @type
 */
export type EventPropertyEventValue =
  | 'tilt'
  | 'fall'
  | 'vibration'
  | 'opened'
  | 'closed'
  | 'click'
  | 'double_click'
  | 'long_press'
  | 'detected'
  | 'not_detected'
  | 'high'
  | 'low'
  | 'normal'
  | 'empty'
  | 'dry'
  | 'leak';
