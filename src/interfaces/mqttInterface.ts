/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */

/**
 * MQTT Interface.
 * https://www.home-assistant.io/integrations/mqtt/
 *
 * @interface
 */
export interface MqttInterface {
  /**
   * Subscribe to the Topic by default.
   */
  subscribeTopic: string;

  /**
   * Topics.
   */
  topics: MqttTopicInterface[];
}

/**
 * MQTT Topic Interface.
 */
export interface MqttTopicInterface {
  /**
   * Device Type.
   */
  deviceType: string;

  /**
   * Name of the State Topic.
   */
  stateTopic: string;

  /**
   * Name of the Config Topic.
   */
  configTopic: string;

  /**
   * Name of the Available Topic.
   */
  availableTopic: 'online' | 'offline';

  /**
   * Command Topics.
   */
  commandTopics: MqttCommandTopicInterface[];
}

/**
 * MQTT Command Topic Interface.
 */
export interface MqttCommandTopicInterface {
  /**
   * Capability.
   */
  capability?: MqttCommandTopicCapabilityInterface;

  /**
   * Property.
   */
  property?: MqttCommandTopicPropertyInterface;

  /**
   * Name of the Command Topic.
   */
  topic: string;
}

/**
 * MQTT Command Topic Capability Interface.
 */
export interface MqttCommandTopicCapabilityInterface {
  /**
   * Capability Type.
   */
  type: string;

  /**
   * Capability State Instance.
   */
  stateInstance: string;
}

/**
 * MQTT Command Topic Property Interface.
 */
export interface MqttCommandTopicPropertyInterface {
  /**
   * Property Type.
   */
  type: string;

  /**
   * Property State Instance.
   */
  stateInstance: string;
}
