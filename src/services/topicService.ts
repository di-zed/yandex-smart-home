/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { RedisClientType } from 'redis';
import mqttService, { CommandTopicData, MqttTopicTypes } from './mqttService';
import configProvider from '../providers/configProvider';
import redisProvider from '../providers/redisProvider';

class TopicService {
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
}

export default new TopicService();
