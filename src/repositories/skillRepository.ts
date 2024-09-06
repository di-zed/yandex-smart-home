/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { RedisClientType } from 'redis';
import { UserInterface } from '../models/userModel';
import { Capability } from '../devices/capability';
import { Device } from '../devices/device';
import { Property } from '../devices/property';
import { ResponsePayload } from '../devices/response';
import { MqttTopicInterface } from '../interfaces/mqttInterface';
import mqttRepository, { MqttOutputTopicNames, TopicData } from './mqttRepository';
import deviceRepository from './deviceRepository';
import userRepository from './userRepository';
import deviceHelper from '../helpers/deviceHelper';
import requestHelper, { RequestOutput } from '../helpers/requestHelper';
import mqttProvider from '../providers/mqttProvider';
import configProvider from '../providers/configProvider';
import redisProvider from '../providers/redisProvider';

/**
 * Skill Repository.
 */
class SkillRepository {
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
   * @param oldMessage
   * @param newMessage
   * @returns Promise<boolean>
   */
  public async callbackState(topic: string, oldMessage: string | undefined, newMessage: string): Promise<boolean> {
    const skillId: string = (process.env.YANDEX_APP_SKILL_ID as string).trim();
    const skillToken: string = (process.env.YANDEX_APP_SKILL_TOKEN as string).trim();

    if (!skillId || !skillToken) {
      return false;
    }

    const topicData: TopicData | undefined = await mqttRepository.getTopicData(topic);
    if (topicData === undefined) {
      return false;
    }

    if (!(await this.isCallbackStateAvailable(topicData, oldMessage, newMessage))) {
      return false;
    }

    const user: UserInterface = await userRepository.getUserByNameOrEmail(topicData.userName);

    const device: Device | undefined = await deviceRepository.getUserDeviceById(user.id, topicData.deviceId);
    if (device === undefined) {
      return false;
    }

    if (!(await this.isDeviceAvailable(user, device))) {
      return false;
    }

    const updatedDevice: Device = await deviceHelper.updateUserDevice(user, device);
    const tempTimeoutDevices: TempTimeoutDevices = await this.addTempUserDevice(user, updatedDevice);

    return new Promise<boolean>((resolve, reject): void => {
      clearTimeout(tempTimeoutDevices.timeoutId);

      tempTimeoutDevices.timeoutId = setTimeout((): void => {
        const body = {
          ts: this.getUnixTimestamp(),
          payload: {
            user_id: String(user.id),
            devices: Object.values(tempTimeoutDevices.payloadDevices),
          },
        };

        requestHelper
          .post(`https://dialogs.yandex.net/api/v1/skills/${skillId}/callback/state`, body, {
            headers: { Authorization: `Bearer ${skillToken}` },
          })
          .then((response: RequestOutput): void => {
            this.logLatestSkillUpdate(user.email, body.payload, response);

            if (response && response.status === 'ok') {
              this.deleteTempUserDevices(user);
              return resolve(true);
            } else {
              return reject(response);
            }
          });
      }, 5000);
    });
  }

  /**
   * Get UNIX Timestamp.
   *
   * @returns number
   */
  public getUnixTimestamp(): number {
    return Math.round(+new Date() / 1000);
  }

  /**
   * Log the latest Skill Update for the User.
   *
   * @param email
   * @param payload
   * @param response
   * @returns Promise<boolean>
   */
  public async logLatestSkillUpdate(email: string, payload: ResponsePayload, response: RequestOutput): Promise<boolean> {
    const redisClient: RedisClientType = await redisProvider.getClientAsync();
    const result: number = await redisClient.hSet(
      'log_user_skill_updates',
      email,
      JSON.stringify(<LogUserSkillUpdate>{
        devices: payload.devices,
        response: response,
        updatedAt: this.getUnixTimestamp(),
      }),
    );

    return result > 0;
  }

  /**
   * Get the latest logged Skill Update for the User.
   *
   * @param email
   * @returns Promise<LogUserSkillUpdate | undefined>
   */
  public async getLatestSkillUpdate(email: string): Promise<LogUserSkillUpdate | undefined> {
    const redisClient: RedisClientType = await redisProvider.getClientAsync();
    const value: string | undefined | null = await redisClient.hGet('log_user_skill_updates', email);

    if (value !== undefined && value !== null) {
      return JSON.parse(value);
    }

    return undefined;
  }

  /**
   * Is Callback State Available?
   *
   * @param topicData
   * @param oldMessage
   * @param newMessage
   * @returns Promise<boolean>
   * @protected
   */
  protected async isCallbackStateAvailable(topicData: TopicData, oldMessage: string | undefined, newMessage: string): Promise<boolean> {
    let result: boolean = false;

    if (topicData.topicType === 'commandTopic') {
      result = oldMessage !== newMessage;
    } else if (topicData.topicType === 'stateTopic') {
      result = await this.isStateTopicChanged(oldMessage, newMessage);
    }

    const callbackIsSkillCallbackStateAvailable = configProvider.getConfigOption('callbackIsSkillCallbackStateAvailable');
    if (typeof callbackIsSkillCallbackStateAvailable === 'function') {
      result = await callbackIsSkillCallbackStateAvailable(topicData, oldMessage, newMessage, result);
    }

    return result;
  }

  /**
   * Check if the State Topic has been changed.
   *
   * @param oldMessage
   * @param newMessage
   * @returns Promise<boolean>
   * @protected
   */
  protected async isStateTopicChanged(oldMessage: string | undefined, newMessage: string): Promise<boolean> {
    const isStateTopicChecked: boolean = (process.env.TOPIC_STATE_CHECK_IF_COMMAND_IS_UNDEFINED as string).trim() === '1';
    if (!isStateTopicChecked) {
      return false;
    }

    let result: boolean = false;

    const topicStateKeys: string[] = [];
    const configTopics: MqttTopicInterface[] = await mqttRepository.getConfigTopics();

    for (const configTopic of configTopics) {
      for (const commandTopic of configTopic.commandTopics) {
        if (commandTopic.topicStateKey) {
          topicStateKeys.push(commandTopic.topicStateKey);
        }
      }
    }

    try {
      const oldStateTopic = oldMessage ? JSON.parse(oldMessage) : {};
      const newStateTopic = JSON.parse(newMessage);

      for (const key of [...new Set(topicStateKeys)]) {
        if (oldStateTopic[key] !== newStateTopic[key]) {
          result = true;
        }
      }
    } catch (err) {
      result = false;
    }

    return result;
  }

  /**
   * Is Device Available?
   *
   * @param user
   * @param device
   * @returns Promise<boolean>
   * @protected
   */
  protected async isDeviceAvailable(user: UserInterface, device: Device): Promise<boolean> {
    let result: boolean = false;

    const topicNames: MqttOutputTopicNames = await mqttRepository.getTopicNames({
      user: user,
      deviceId: device.id,
    });

    if (topicNames.availableTopic) {
      result = (await mqttProvider.getTopicMessage(topicNames.availableTopic)) !== 'offline';
    }

    const callbackIsSkillDeviceAvailable = configProvider.getConfigOption('callbackIsSkillDeviceAvailable');
    if (typeof callbackIsSkillDeviceAvailable === 'function') {
      result = await callbackIsSkillDeviceAvailable(user, device, topicNames, result);
    }

    return result;
  }

  /**
   * Add Temporary User Device.
   *
   * @param user
   * @param updatedDevice
   * @returns Promise<TempTimeoutDevices>
   * @protected
   */
  protected async addTempUserDevice(user: UserInterface, updatedDevice: Device): Promise<TempTimeoutDevices> {
    if (this.tempUserDevices[user.id] === undefined) {
      this.tempUserDevices[user.id] = { timeoutId: undefined, payloadDevices: {} };
    }

    this.tempUserDevices[user.id].payloadDevices[updatedDevice.id] = this.getPayloadDevice(updatedDevice);

    return this.tempUserDevices[user.id];
  }

  /**
   * Get Payload Device.
   *
   * @param updatedDevice
   * @returns Device
   * @protected
   */
  protected getPayloadDevice(updatedDevice: Device): Device {
    const capabilities: Capability[] = [];
    const properties: Property[] = [];

    for (const capability of updatedDevice.capabilities || []) {
      capabilities.push({
        type: capability.type,
        state: capability.state,
      });
    }

    for (const property of updatedDevice.properties || []) {
      properties.push({
        type: property.type,
        state: property.state,
      });
    }

    return <Device>{
      id: updatedDevice.id,
      capabilities: capabilities,
      properties: properties,
    };
  }

  /**
   * Delete Temporary User Devices.
   *
   * @param user
   * @returns void
   * @protected
   */
  protected deleteTempUserDevices(user: UserInterface): void {
    delete this.tempUserDevices[user.id];
  }
}

/**
 * Temp Payload Devices Type.
 */
export type TempPayloadDevices = {
  /**
   * Device ID => Payload Device.
   */
  [key: string]: Device;
};

/**
 * Temp Timeout Devices Type.
 */
export type TempTimeoutDevices = {
  timeoutId: any;
  payloadDevices: TempPayloadDevices;
};

/**
 * Log User Skill Update Type.
 */
export type LogUserSkillUpdate = {
  devices: Device[];
  response: RequestOutput;
  updatedAt: number;
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
