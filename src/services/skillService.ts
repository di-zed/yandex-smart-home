/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { RedisClientType } from 'redis';
import { UserInterface } from '../models/userModel';
import { Capability } from '../devices/capability';
import { Device } from '../devices/device';
import { Property } from '../devices/property';
import userRepository from '../repositories/userRepository';
import configProvider from '../providers/configProvider';
import httpProvider, { RequestOutput } from '../providers/httpProvider';
import redisProvider from '../providers/redisProvider';
import deviceService from './deviceService';
import mqttService, { TopicData } from './mqttService';
import topicService, { ChangedCommandTopicInterface } from './topicService';

/**
 * Skill Service.
 */
class SkillService {
  /**
   * Temporary User Devices.
   *
   * @protected
   */
  protected tempUserDevices: TempUserDevices = {};

  /**
   * Temporary User State Callbacks.
   *
   * @protected
   */
  protected tempUserStateCallbacks: TempUserStateCallbacks = {};

  /**
   * Yandex Callbacks initialization.
   *
   * @param topic
   * @param oldMessage
   * @param newMessage
   * @returns Promise<boolean>
   */
  public async initYandexCallbacks(topic: string, oldMessage: string | undefined, newMessage: string): Promise<boolean> {
    const skillId: string = (process.env.YANDEX_APP_SKILL_ID as string).trim();
    const skillToken: string = (process.env.YANDEX_APP_SKILL_TOKEN as string).trim();

    if (!skillId || !skillToken) {
      return false;
    }

    const topicData: TopicData | undefined = await mqttService.getTopicData(topic);
    if (topicData === undefined) {
      return false;
    }

    if (!(await this.isCallbackStateAvailable(topicData, oldMessage, newMessage))) {
      return false;
    }

    const user: UserInterface = await userRepository.getUserByNameOrEmail(topicData.userName);

    const device: Device | undefined = await deviceService.getUserDeviceById(user.id, topicData.deviceId);
    if (device === undefined) {
      return false;
    }

    const updatedDevice: Device = await deviceService.updateUserDevice(user, device);
    const tempTimeoutDevices: TempTimeoutDevices = await this.addTempUserDevice(user, updatedDevice);

    return new Promise<boolean>((resolve, reject): void => {
      clearTimeout(tempTimeoutDevices.timeoutId);

      tempTimeoutDevices.timeoutId = setTimeout((): void => {
        if (tempTimeoutDevices.isDeviceParameterChanged) {
          this.callbackDiscovery(user.id)
            .then((response: RequestOutput | boolean): void => {
              if (typeof response === 'object' && response.status === 'ok') {
                this.tempUserStateCallbacks[user.id] = true;
                // The State Callback will be executed later
                // via the Rest User controller (devices action) callback function.
                return resolve(true);
              } else {
                // console.log('ERROR! Init Yandex Callbacks, parameter changed.', { response });
                return reject(response);
              }
            })
            .catch((err) => {
              return reject(err);
            });
        } else {
          this.tempUserStateCallbacks[user.id] = true;
          this.execTempUserStateCallback(user, Object.values(tempTimeoutDevices.payloadDevices))
            .then((response: RequestOutput | boolean): void => {
              if (typeof response === 'object' && response.status === 'ok') {
                return resolve(true);
              } else {
                // console.log('ERROR! Init Yandex Callbacks, parameter NOT changed.', { response });
                return reject(response);
              }
            })
            .catch((err) => {
              return reject(err);
            });
        }
      }, 3000);
    });
  }

  /**
   * Execute temporary user state callback.
   *
   * @param user
   * @param devices
   * @returns Promise<RequestOutput | boolean>
   */
  public async execTempUserStateCallback(user: UserInterface, devices: Device[]): Promise<RequestOutput | boolean> {
    if (!this.tempUserStateCallbacks[user.id]) {
      return false;
    }

    try {
      const response: RequestOutput | boolean = await this.callbackState(user.id, devices);

      if (typeof response === 'object' && response.status === 'ok') {
        delete this.tempUserStateCallbacks[user.id];

        this.deleteTempUserDevices(user);
        await this.logLatestSkillUpdate(user.email, devices);
      }

      return response;
    } catch (err) {
      console.log('ERROR! Execute temporary user state callback.', err);
      return false;
    }
  }

  /**
   * Notification about device state change.
   * https://yandex.ru/dev/dialogs/smart-home/doc/en/reference-alerts/post-skill_id-callback-state
   *
   * @param userId
   * @param devices
   * @returns Promise<RequestOutput | boolean>
   */
  public async callbackState(userId: string | number, devices: Device[]): Promise<RequestOutput | boolean> {
    const skillId: string = (process.env.YANDEX_APP_SKILL_ID as string).trim();
    const skillToken: string = (process.env.YANDEX_APP_SKILL_TOKEN as string).trim();

    if (!skillId || !skillToken) {
      return false;
    }

    const payloadDevices: Device[] = [];
    for (const device of devices) {
      payloadDevices.push(this.getPayloadDevice(device));
    }

    try {
      const body = {
        ts: this.getUnixTimestamp(),
        payload: {
          user_id: String(userId),
          devices: payloadDevices,
        },
      };

      const response: RequestOutput = await httpProvider.post(`https://dialogs.yandex.net/api/v1/skills/${skillId}/callback/state`, body, {
        headers: { Authorization: `Bearer ${skillToken}` },
      });

      const callbackSkillState = configProvider.getConfigOption('callbackSkillState');
      if (typeof callbackSkillState === 'function') {
        callbackSkillState(response, body).catch((err: any) => console.log('ERROR! Skill Callback State Config Method.', err));
      }

      return response;
    } catch (err) {
      console.log('ERROR! Skill Callback State Request.', err);
      return false;
    }
  }

  /**
   * Notification about device parameter change.
   * https://yandex.ru/dev/dialogs/smart-home/doc/en/reference-alerts/post-skill_id-callback-discovery
   *
   * @param userId
   * @returns Promise<RequestOutput | boolean>
   */
  public async callbackDiscovery(userId: string | number): Promise<RequestOutput | boolean> {
    const skillId: string = (process.env.YANDEX_APP_SKILL_ID as string).trim();
    const skillToken: string = (process.env.YANDEX_APP_SKILL_TOKEN as string).trim();

    if (!skillId || !skillToken) {
      return false;
    }

    try {
      const body = {
        ts: this.getUnixTimestamp(),
        payload: {
          user_id: String(userId),
        },
      };

      const response: RequestOutput = await httpProvider.post(`https://dialogs.yandex.net/api/v1/skills/${skillId}/callback/discovery`, body, {
        headers: { Authorization: `Bearer ${skillToken}` },
      });

      const callbackSkillDiscovery = configProvider.getConfigOption('callbackSkillDiscovery');
      if (typeof callbackSkillDiscovery === 'function') {
        callbackSkillDiscovery(response, body).catch((err: any) => console.log('ERROR! Skill Callback Discovery Config Method.', err));
      }

      return response;
    } catch (err) {
      console.log('ERROR! Skill Callback Discovery Request.', err);
      return false;
    }
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
   * @param devices
   * @returns Promise<boolean>
   */
  public async logLatestSkillUpdate(email: string, devices: Device[]): Promise<boolean> {
    const redisClient: RedisClientType = await redisProvider.getClientAsync();
    const result: number = await redisClient.hSet(
      'log_user_skill_updates',
      email,
      JSON.stringify(<LogUserSkillUpdate>{
        devices: devices,
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
   */
  public async isCallbackStateAvailable(topicData: TopicData, oldMessage: string | undefined, newMessage: string): Promise<boolean> {
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
   * @param deviceType
   * @returns Promise<boolean>
   */
  public async isStateTopicChanged(oldMessage: string | undefined, newMessage: string, deviceType: string = ''): Promise<boolean> {
    const changes: ChangedCommandTopicInterface[] = await topicService.getStateTopicChanges(oldMessage, newMessage, deviceType);
    return changes.length > 0;
  }

  /**
   * Check if the device has the wrong property with the "event" type.
   *
   * @param user
   * @param updatedDevice
   * @returns Promise<boolean>
   * @protected
   */
  protected async isDeviceParameterChanged(user: UserInterface, updatedDevice: Device): Promise<boolean> {
    const latestSkillUpdate: LogUserSkillUpdate | undefined = await this.getLatestSkillUpdate(user.email);
    if (latestSkillUpdate === undefined) {
      return true;
    }

    let result: boolean = false;

    for (const latestDevice of latestSkillUpdate.devices) {
      if (latestDevice.id !== updatedDevice.id) {
        continue;
      }

      if (latestDevice.capabilities?.length !== updatedDevice.capabilities?.length) {
        result = true;
      }
      if (latestDevice.properties?.length !== updatedDevice.properties?.length) {
        result = true;
      }
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
      this.tempUserDevices[user.id] = {
        timeoutId: undefined,
        payloadDevices: {},
        isDeviceParameterChanged: false,
      };
    }

    this.tempUserDevices[user.id].payloadDevices[updatedDevice.id] = this.getPayloadDevice(updatedDevice);

    if (!this.tempUserDevices[user.id].isDeviceParameterChanged) {
      this.tempUserDevices[user.id].isDeviceParameterChanged = await this.isDeviceParameterChanged(user, updatedDevice);
    }

    return this.tempUserDevices[user.id];
  }

  /**
   * Get Payload Device.
   *
   * @param device
   * @returns Device
   * @protected
   */
  protected getPayloadDevice(device: Device): Device {
    const result: Device = { id: device.id };

    if (device.error_code) {
      result.error_code = device.error_code;
      result.error_message = device.error_message || '';
      return result;
    }

    result.capabilities = [];
    for (const capability of device.capabilities || []) {
      result.capabilities.push({
        type: capability.type,
        state: capability.state,
      });
    }

    result.properties = [];
    for (const property of device.properties || []) {
      result.properties.push({
        type: property.type,
        state: property.state,
      });
    }

    return result;
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
  isDeviceParameterChanged: boolean;
};

/**
 * Log User Skill Update Type.
 */
export type LogUserSkillUpdate = {
  devices: Device[];
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

/**
 * Temporary User State Callbacks Type.
 */
export type TempUserStateCallbacks = {
  /**
   * User ID => True/False.
   */
  [key: string | number]: boolean;
};

export default new SkillService();
