/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { RedisClientType } from 'redis';
import { MqttCommandTopicInterface, MqttTopicInterface } from '../interfaces/mqttInterface';
import mqttService, { CommandTopicData, MqttTopicTypes } from './mqttService';
import configProvider from '../providers/configProvider';
import redisProvider from '../providers/redisProvider';
import mqttRepository from '../repositories/mqttRepository';
import topicExpiredEvent from '../events/topicExpiredEvent';

/**
 * Topic Service.
 */
class TopicService {
  /**
   * The Topic Timeout IDs.
   *
   * @protected
   */
  protected topicTimeoutIds: TopicTimeoutIds = {};

  /**
   * Prepare Message for the MQTT Topic.
   *
   * @param aliceValue
   * @param topicData
   * @returns Promise<string>
   */
  public async convertAliceValueToMqttMessage(aliceValue: any, topicData?: CommandTopicData): Promise<string> {
    let mqttMessage: string = '';

    if (topicData) {
      for (const [message, value] of Object.entries(topicData.messageValueMapping)) {
        if (value === aliceValue && message !== '__default') {
          mqttMessage = String(message).toLowerCase();
        }
      }
    }

    if (mqttMessage === '') {
      switch (typeof aliceValue) {
        case 'boolean':
          mqttMessage = aliceValue ? 'on' : 'off';
          break;
        case 'object':
          mqttMessage = JSON.stringify(aliceValue);
          break;
        default:
          mqttMessage = String(aliceValue).toLowerCase();
      }
    }

    const functionConvertAliceValueToMqttMessage = configProvider.getConfigOption('functionConvertAliceValueToMqttMessage');
    if (typeof functionConvertAliceValueToMqttMessage === 'function') {
      return (await functionConvertAliceValueToMqttMessage(aliceValue, mqttMessage, topicData)) as string;
    }

    return mqttMessage;
  }

  /**
   * Prepare Value for the Alice Device Capability State.
   *
   * @param mqttMessage
   * @param topicData
   * @returns Promise<any>
   */
  public async convertMqttMessageToAliceValue(mqttMessage: string, topicData?: CommandTopicData): Promise<any> {
    let aliceValue: any = undefined;
    const handledMessage: string = mqttMessage.toLowerCase();

    if (topicData) {
      if (topicData.messageValueMapping[handledMessage] !== undefined) {
        aliceValue = topicData.messageValueMapping[handledMessage];
      } else if (topicData.messageValueMapping['__default'] !== undefined) {
        aliceValue = topicData.messageValueMapping['__default'];
      }
    }

    if (aliceValue === undefined) {
      if (handledMessage === 'on' || handledMessage === 'off') {
        aliceValue = handledMessage === 'on';
      } else if (!isNaN(Number(handledMessage))) {
        aliceValue = Number(handledMessage);
      } else {
        try {
          const value = JSON.parse(mqttMessage);
          if (value && typeof value === 'object') {
            aliceValue = value;
          }
        } catch (err) {
          aliceValue = handledMessage.toString();
        }
      }
    }

    const functionConvertMqttMessageToAliceValue = configProvider.getConfigOption('functionConvertMqttMessageToAliceValue');
    if (typeof functionConvertMqttMessageToAliceValue === 'function') {
      return (await functionConvertMqttMessageToAliceValue(mqttMessage, aliceValue, topicData)) as string;
    }

    return aliceValue;
  }

  /**
   * Set Topic Message to the Cache.
   *
   * @param topic
   * @param message
   * @returns Promise<boolean>
   */
  public async setTopicMessage(topic: string, message: string): Promise<boolean> {
    const redisClient: RedisClientType = await redisProvider.getClientAsync();
    const result: number = await redisClient.hSet('topics', topic, message);

    const topicLifetimes: { topicType: MqttTopicTypes; lifetimeSec: number }[] = [
      {
        topicType: 'availableTopic',
        lifetimeSec: parseInt(process.env.TOPIC_AVAILABLE_CACHE_LIFETIME_SEC as string, 10),
      },
      {
        topicType: 'commandTopic',
        lifetimeSec: parseInt(process.env.TOPIC_COMMAND_CACHE_LIFETIME_SEC as string, 10),
      },
      {
        topicType: 'stateTopic',
        lifetimeSec: parseInt(process.env.TOPIC_STATE_CACHE_LIFETIME_SEC as string, 10),
      },
    ];

    for (const topicLifetime of topicLifetimes) {
      if (!isNaN(topicLifetime.lifetimeSec)) {
        if (await mqttService.isTopicType(topic, topicLifetime.topicType)) {
          await redisClient.sendCommand(['HEXPIRE', 'topics', String(topicLifetime.lifetimeSec), 'FIELDS', '1', topic]);

          // Event when the topic has disappeared from the Redis storage:

          const self = this;
          clearTimeout(this.topicTimeoutIds[topic]);

          this.topicTimeoutIds[topic] = setTimeout(
            function (): void {
              delete self.topicTimeoutIds[topic];

              topicExpiredEvent.execute(topic, message).catch((err): void => {
                console.log('ERROR! Topic Expired Event.', err instanceof Error ? err.message : err);
              });
            },
            topicLifetime.lifetimeSec * 1000 * 1.5,
          );

          break;
        }
      }
    }

    return result > 0;
  }

  /**
   * Get Topic Message from the Cache.
   *
   * @param topic
   * @returns Promise<string | undefined>
   */
  public async getTopicMessage(topic: string): Promise<string | undefined> {
    const redisClient: RedisClientType = await redisProvider.getClientAsync();
    const value: string | undefined | null = await redisClient.hGet('topics', topic);

    return value !== undefined && value !== null ? value : undefined;
  }

  /**
   * Get Value from the State Topic by Keys.
   *
   * @param topic
   * @param keys
   * @returns Promise<string | undefined>
   */
  public async getStateTopicValueByKey(topic: string, keys: string[]): Promise<string | undefined> {
    if (!topic.trim() || keys.length === 0) {
      return undefined;
    }
    if (!(await mqttService.isTopicType(topic, 'stateTopic'))) {
      return undefined;
    }

    let result: string | undefined = undefined;

    const message: string | undefined = await this.getTopicMessage(topic);
    if (message !== undefined) {
      try {
        const data = JSON.parse(message);
        keys.forEach((key) => {
          if (result === undefined) {
            result = data[key] !== undefined ? String(data[key]) : undefined;
          }
        });
      } catch (err) {
        return undefined;
      }
    }

    return result;
  }

  /**
   * Get State Topic changes.
   *
   * @param oldMessage
   * @param newMessage
   * @param deviceType
   * @returns Promise<ChangedCommandTopicInterface[]>
   */
  public async getStateTopicChanges(
    oldMessage: string | undefined,
    newMessage: string,
    deviceType: string = '',
  ): Promise<ChangedCommandTopicInterface[]> {
    const isStateTopicChecked: boolean = (process.env.TOPIC_STATE_CHECK_IF_COMMAND_IS_UNDEFINED as string).trim() === '1';
    if (!isStateTopicChecked) {
      return [];
    }

    const result: ChangedCommandTopicInterface[] = [];
    const configTopics: MqttTopicInterface[] = await mqttRepository.getConfigTopics();

    try {
      const oldStateTopic = oldMessage ? JSON.parse(oldMessage) : {};
      const newStateTopic = JSON.parse(newMessage);

      for (const configTopic of configTopics) {
        if (deviceType) {
          if (configTopic.deviceType !== deviceType) {
            continue;
          }
        }
        for (const commandTopic of configTopic.commandTopics) {
          for (const key of commandTopic.topicStateKeys || []) {
            if (oldStateTopic[key] !== newStateTopic[key]) {
              const item: ChangedCommandTopicInterface = Object.assign(commandTopic, {
                deviceType: configTopic.deviceType,
                mqttValueOld: oldStateTopic[key],
                mqttValueNew: newStateTopic[key],
              });
              result.push(item);
            }
          }
        }
      }
    } catch (err) {
      return [];
    }

    return result;
  }
}

/**
 * Changed MQTT Command Topic Interface.
 */
export interface ChangedCommandTopicInterface extends MqttCommandTopicInterface {
  deviceType: string;
  mqttValueOld: string | number;
  mqttValueNew: string | number;
}

/**
 * The "Topic => Timeout ID" Type.
 */
export type TopicTimeoutIds = {
  [key: string]: ReturnType<typeof setTimeout>;
};

export default new TopicService();
