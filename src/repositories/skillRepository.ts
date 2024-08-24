/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { UserInterface } from '../models/userModel';
import { Capability } from '../devices/capability';
import { Device } from '../devices/device';
import { Property } from '../devices/property';
import { ResponsePayload } from '../devices/response';
import mqttRepository, { CommandTopicData, TopicData } from './mqttRepository';
import deviceRepository from './deviceRepository';
import userRepository from './userRepository';
import requestHelper, { RequestOutput } from '../helpers/requestHelper';

/**
 * Skill Repository.
 */
class SkillRepository {
  /**
   * Cached Callback Data.
   *
   * @protected
   */
  protected cacheCallbackData: CallbackDataCache = {};

  /**
   * Temporary User Devices.
   *
   * @protected
   */
  protected tempUserDevices: TempUserDevices = {};

  /**
   * Notification about device state change.
   * https://yandex.ru/dev/dialogs/smart-home/doc/en/reference-alerts/post-skill_id-callback-state
   *
   * @param topic
   * @param message
   * @returns Promise<boolean>
   */
  public async callbackState(topic: string, message: string): Promise<boolean> {
    const skillId: string = (process.env.YANDEX_APP_SKILL_ID as string).trim();
    const skillToken: string = (process.env.YANDEX_APP_SKILL_TOKEN as string).trim();

    if (!skillId || !skillToken) {
      return false;
    }

    const callbackData: CallbackData | undefined = await this.getCallbackData(topic);
    if (!callbackData) {
      return false;
    }

    const tempUserDevices: TempTimeoutDevices = await this.addTempUserDevices(callbackData, topic, message);

    return new Promise<boolean>((resolve, reject): void => {
      clearTimeout(tempUserDevices.timeoutId);

      tempUserDevices.timeoutId = setTimeout((): void => {
        const body = {
          ts: this.getUnixTimestamp(),
          payload: this.getCallbackStatePayload(callbackData.userId, tempUserDevices.deviceTopics),
        };

        requestHelper
          .post(`https://dialogs.yandex.net/api/v1/skills/${skillId}/callback/state`, body, {
            headers: { Authorization: `Bearer ${skillToken}` },
          })
          .then((response: RequestOutput): void => {
            if (response && response.status === 'ok') {
              this.deleteTempUserDevices(callbackData.userId);
              return resolve(true);
            } else {
              return reject(response);
            }
          });
      }, 5000);
    });
  }

  /**
   * Get Callback Data.
   *
   * @param topic
   * @returns Promise<CallbackData>
   * @protected
   */
  protected async getCallbackData(topic: string): Promise<CallbackData | undefined> {
    if (this.cacheCallbackData[topic] !== undefined) {
      return this.cacheCallbackData[topic];
    }

    const topicData: TopicData | undefined = await mqttRepository.getTopicData(topic);
    if (!topicData || topicData.topicType !== 'commandTopic') {
      return undefined;
    }

    const user: UserInterface = await userRepository.getUserByNameOrEmail(topicData.userName);

    const device: Device | undefined = await deviceRepository.getUserDeviceById(user.id, topicData.deviceId);
    if (!device) {
      throw new Error('Device can not be found.');
    }

    const commandTopicData: CommandTopicData | undefined = await mqttRepository.getCommandTopicData(topic, device.type || '');
    if (!commandTopicData) {
      throw new Error('Command Topic Data can not be found.');
    }

    this.cacheCallbackData[topic] = <CallbackData>Object.assign(commandTopicData, {
      userId: user.id,
    });

    return this.cacheCallbackData[topic];
  }

  /**
   * Add Temporary User Devices.
   *
   * @param callbackData
   * @param topic
   * @param message
   * @returns Promise<TempTimeoutDevices>
   * @protected
   */
  protected async addTempUserDevices(callbackData: CallbackData, topic: string, message: string): Promise<TempTimeoutDevices> {
    if (this.tempUserDevices[callbackData.userId] === undefined) {
      this.tempUserDevices[callbackData.userId] = { timeoutId: undefined, deviceTopics: {} };
    }
    if (this.tempUserDevices[callbackData.userId].deviceTopics[callbackData.deviceId] === undefined) {
      this.tempUserDevices[callbackData.userId].deviceTopics[callbackData.deviceId] = {};
    }

    this.tempUserDevices[callbackData.userId].deviceTopics[callbackData.deviceId][topic] = await mqttRepository.convertMqttMessageToAliceValue(
      message,
      callbackData,
    );

    return this.tempUserDevices[callbackData.userId];
  }

  /**
   * Delete Temp User Devices.
   *
   * @param userId
   * @returns void
   * @protected
   */
  protected deleteTempUserDevices(userId: string | number): void {
    delete this.tempUserDevices[userId];
  }

  /**
   * Get Callback State Payload.
   *
   * @param userId
   * @param deviceTopics
   * @returns ResponsePayload
   * @protected
   */
  protected getCallbackStatePayload(userId: string | number, deviceTopics: TempDeviceTopics): ResponsePayload {
    const payload: ResponsePayload = {
      user_id: String(userId),
      devices: [],
    };

    for (const deviceId in deviceTopics) {
      const capabilities: Capability[] = [];
      const properties: Property[] = [];

      for (const topicName in deviceTopics[deviceId]) {
        const callbackData: CallbackData = this.cacheCallbackData[topicName];
        const aliveValue: string = deviceTopics[deviceId][topicName];

        if (callbackData.capabilityType && callbackData.capabilityStateInstance) {
          capabilities.push({
            type: callbackData.capabilityType,
            state: {
              instance: callbackData.capabilityStateInstance,
              value: aliveValue,
            },
          });
        }

        if (callbackData.propertyType && callbackData.propertyStateInstance) {
          properties.push({
            type: callbackData.propertyType,
            state: {
              instance: callbackData.propertyStateInstance,
              value: aliveValue,
            },
          });
        }
      }

      payload.devices.push({
        id: deviceId,
        capabilities: capabilities,
        properties: properties,
      });
    }

    return payload;
  }

  /**
   * Get UNIX Timestamp.
   *
   * @returns number
   * @protected
   */
  protected getUnixTimestamp(): number {
    return Math.round(+new Date() / 1000);
  }
}

/**
 * Callback Data Type.
 */
export type CallbackData = CommandTopicData & {
  userId: string | number;
};

/**
 * Callback Data Cache Type.
 */
export type CallbackDataCache = {
  /**
   * Topic Name => Callback Data.
   */
  [key: string]: CallbackData;
};

/**
 * Temp Device Topics Type.
 */
export type TempDeviceTopics = {
  /**
   * Device ID => Topics.
   */
  [key: string]: {
    /**
     * Topic Name => Alice Value.
     */
    [key: string]: any;
  };
};

/**
 * Temp Timeout Devices Type.
 */
export type TempTimeoutDevices = {
  timeoutId: any;
  deviceTopics: TempDeviceTopics;
};

/**
 * Temporary User Devices Type.
 */
export type TempUserDevices = {
  /**
   * User ID => Timeout Devices.
   */
  [key: string | number]: TempTimeoutDevices;
};

export default new SkillRepository();
