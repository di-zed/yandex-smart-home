/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Device } from '../devices/device';
import { EventProperty } from '../devices/properties/eventProperty';
import { UserInterface } from '../models/userModel';
import configProvider from '../providers/configProvider';
import deviceRepository from '../repositories/deviceRepository';
import userRepository from '../repositories/userRepository';
import mqttService, { CommandTopicData, MqttInputTopicNames, MqttOutputTopicNames } from './mqttService';
import topicService from './topicService';

/**
 * Device Service.
 */
class DeviceService {
  /**
   * Get Devices by User ID.
   *
   * @param userId
   * @returns Promise<Device[]>
   */
  public async getUserDevices(userId: string | number): Promise<Device[]> {
    const user: UserInterface = await userRepository.getUserById(userId);
    const devices: Device[] = await deviceRepository.getConfigDevices();

    const functionGetUserDevices = configProvider.getConfigOption('functionGetUserDevices');
    if (typeof functionGetUserDevices === 'function') {
      return (await functionGetUserDevices(user, devices)) as Device[];
    }

    const result: Device[] = [];

    user.deviceIds.forEach((deviceId: string): void => {
      const device: Device | undefined = devices.find((element: Device): boolean => element.id === deviceId);
      if (device) {
        result.push(device);
      }
    });

    return result;
  }

  /**
   * Get User Device by ID.
   *
   * @param userId
   * @param deviceId
   * @returns Promise<Device | undefined>
   */
  public async getUserDeviceById(userId: string | number, deviceId: string): Promise<Device | undefined> {
    let result: Device | undefined = undefined;
    const userDevices: Device[] = await this.getUserDevices(userId);

    userDevices.forEach((userDevice: Device): void => {
      if (userDevice.id === deviceId) {
        result = userDevice;
      }
    });

    return result;
  }

  /**
   * Update User Device.
   *
   * @param user
   * @param device
   * @param deleteWrongProperties
   * @returns Device
   */
  public async updateUserDevice(user: UserInterface, device: Device, deleteWrongProperties: boolean = true): Promise<Device> {
    const deviceClone: Device = JSON.parse(JSON.stringify(device));
    const isStateTopicChecked: boolean = (process.env.TOPIC_STATE_CHECK_IF_COMMAND_IS_UNDEFINED as string).trim() === '1';

    /**
     * Update Capabilities.
     */

    for (const capability of deviceClone.capabilities || []) {
      const capabilityTopicNames: MqttOutputTopicNames = await mqttService.getTopicNames(<MqttInputTopicNames>{
        user: user,
        deviceId: device.id,
        capabilityType: capability.type,
        capabilityStateInstance: capability.state?.instance,
      });

      let capabilityTopicData: CommandTopicData | undefined = undefined;
      if (deviceClone.type) {
        capabilityTopicData = await mqttService.getCommandTopicData(capabilityTopicNames.commandTopic, deviceClone.type, {
          capabilityType: capability.type,
          capabilityStateInstance: capability.state?.instance,
        });
      }

      let capabilityMessage: string | undefined = await topicService.getTopicMessage(capabilityTopicNames.commandTopic);
      if (capabilityMessage === undefined && capabilityTopicData !== undefined && isStateTopicChecked) {
        capabilityMessage = await topicService.getStateTopicValueByKey(capabilityTopicNames.stateTopic, capabilityTopicData.topicStateKeys);
      }

      if (capabilityMessage !== undefined) {
        capability.state!.value = await topicService.convertMqttMessageToAliceValue(capabilityMessage, capabilityTopicData);
      }
    }

    /**
     * Update Properties.
     */

    const handledProperties = [];

    for (const property of deviceClone.properties || []) {
      const propertyTopicNames: MqttOutputTopicNames = await mqttService.getTopicNames(<MqttInputTopicNames>{
        user: user,
        deviceId: device.id,
        propertyType: property.type,
        propertyStateInstance: property.state?.instance,
      });

      let propertyTopicData: CommandTopicData | undefined = undefined;
      if (deviceClone.type) {
        propertyTopicData = await mqttService.getCommandTopicData(propertyTopicNames.commandTopic, deviceClone.type, {
          propertyType: property.type,
          propertyStateInstance: property.state?.instance,
        });
      }

      let propertyMessage: string | undefined = await topicService.getTopicMessage(propertyTopicNames.commandTopic);
      if (propertyMessage === undefined && propertyTopicData !== undefined && isStateTopicChecked) {
        propertyMessage = await topicService.getStateTopicValueByKey(propertyTopicNames.stateTopic, propertyTopicData.topicStateKeys);
      }

      if (propertyMessage !== undefined) {
        property.state!.value = await topicService.convertMqttMessageToAliceValue(propertyMessage, propertyTopicData);
      }

      /**
       * Skip the wrong property if needed.
       */

      if (deleteWrongProperties) {
        if (property.type === 'devices.properties.event') {
          let isValidEventValue: boolean = false;

          for (const event of (<EventProperty>property).parameters?.events || []) {
            if (event.value === property.state!.value) {
              isValidEventValue = true;
            }
          }

          if (!isValidEventValue) {
            continue;
          }
        }
      }

      handledProperties.push(property);
    }

    deviceClone.properties = handledProperties;

    return deviceClone;
  }

  /**
   * Is Device Available?
   *
   * @param user
   * @param device
   * @returns Promise<boolean>
   */
  public async isDeviceAvailable(user: UserInterface, device: Device): Promise<boolean> {
    let result: boolean = true;

    const topicNames: MqttOutputTopicNames = await mqttService.getTopicNames({
      user: user,
      deviceId: device.id,
    });

    if (topicNames.availableTopic) {
      result = (await topicService.getTopicMessage(topicNames.availableTopic)) === 'online';
    }
    if (!topicNames.stateTopic || !(await topicService.getTopicMessage(topicNames.stateTopic))) {
      result = false;
    }

    const callbackIsDeviceAvailable = configProvider.getConfigOption('callbackIsDeviceAvailable');
    if (typeof callbackIsDeviceAvailable === 'function') {
      result = await callbackIsDeviceAvailable(user, device, topicNames, result);
    }

    return result;
  }
}

export default new DeviceService();
