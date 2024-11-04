/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Capability } from '../devices/capability';
import { Property } from '../devices/property';
import { Device } from '../devices/device';
import { EventProperty } from '../devices/properties/eventProperty';
import { UserInterface } from '../models/userModel';
import mqttRepository, { CommandTopicData, MqttInputTopicNames, MqttOutputTopicNames } from '../repositories/mqttRepository';
import mqttProvider from '../providers/mqttProvider';

/**
 * Device Helper.
 */
class DeviceHelper {
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
      const capabilityTopicNames: MqttOutputTopicNames = await mqttRepository.getTopicNames(<MqttInputTopicNames>{
        user: user,
        deviceId: device.id,
        capabilityType: capability.type,
        capabilityStateInstance: capability.state?.instance,
      });

      let capabilityTopicData: CommandTopicData | undefined = undefined;
      if (deviceClone.type) {
        capabilityTopicData = await mqttRepository.getCommandTopicData(capabilityTopicNames.commandTopic, deviceClone.type, {
          capabilityType: capability.type,
          capabilityStateInstance: capability.state?.instance,
        });
      }

      let capabilityMessage: string | undefined = await mqttProvider.getTopicMessage(capabilityTopicNames.commandTopic);
      if (capabilityMessage === undefined && capabilityTopicData !== undefined && isStateTopicChecked) {
        capabilityMessage = await mqttProvider.getStateTopicValueByKey(capabilityTopicNames.stateTopic, capabilityTopicData.topicStateKeys);
      }

      if (capabilityMessage !== undefined) {
        capability.state!.value = await mqttRepository.convertMqttMessageToAliceValue(capabilityMessage, capabilityTopicData);
      }
    }

    /**
     * Update Properties.
     */

    const handledProperties = [];

    for (const property of deviceClone.properties || []) {
      const propertyTopicNames: MqttOutputTopicNames = await mqttRepository.getTopicNames(<MqttInputTopicNames>{
        user: user,
        deviceId: device.id,
        propertyType: property.type,
        propertyStateInstance: property.state?.instance,
      });

      let propertyTopicData: CommandTopicData | undefined = undefined;
      if (deviceClone.type) {
        propertyTopicData = await mqttRepository.getCommandTopicData(propertyTopicNames.commandTopic, deviceClone.type, {
          propertyType: property.type,
          propertyStateInstance: property.state?.instance,
        });
      }

      let propertyMessage: string | undefined = await mqttProvider.getTopicMessage(propertyTopicNames.commandTopic);
      if (propertyMessage === undefined && propertyTopicData !== undefined && isStateTopicChecked) {
        propertyMessage = await mqttProvider.getStateTopicValueByKey(propertyTopicNames.stateTopic, propertyTopicData.topicStateKeys);
      }

      if (propertyMessage !== undefined) {
        property.state!.value = await mqttRepository.convertMqttMessageToAliceValue(propertyMessage, propertyTopicData);
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
   * Get Device Capability.
   *
   * @param device
   * @param capabilityType
   * @param capabilityStateInstance
   * @returns Capability | undefined
   */
  public getDeviceCapability(device: Device, capabilityType: string, capabilityStateInstance: string): Capability | undefined {
    let result: Capability | undefined = undefined;

    for (const capability of device.capabilities || []) {
      if (capability.type === capabilityType && capability.state?.instance === capabilityStateInstance) {
        result = <Capability>JSON.parse(JSON.stringify(capability));
      }
    }

    return result;
  }

  /**
   * Get Device Property.
   *
   * @param device
   * @param propertyType
   * @param propertyStateInstance
   * @returns Property | undefined
   */
  public getDeviceProperty(device: Device, propertyType: string, propertyStateInstance: string): Property | undefined {
    let result: Property | undefined = undefined;

    for (const property of device.properties || []) {
      if (property.type === propertyType && property.state?.instance === propertyStateInstance) {
        result = <Property>JSON.parse(JSON.stringify(property));
      }
    }

    return result;
  }
}

export default new DeviceHelper();
