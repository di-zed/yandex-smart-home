/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { UserInterface } from '../models/userModel';
import { Device } from '../devices/device';
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
   * @returns Device
   */
  public async updateUserDevice(user: UserInterface, device: Device): Promise<Device> {
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
        capabilityMessage = await mqttProvider.getStateTopicValueByKey(capabilityTopicNames.stateTopic, capabilityTopicData.topicStateKey);
      }

      if (capabilityMessage !== undefined) {
        capability.state!.value = await mqttRepository.convertMqttMessageToAliceValue(capabilityMessage, capabilityTopicData);
      }
    }

    /**
     * Update Properties.
     */

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
        propertyMessage = await mqttProvider.getStateTopicValueByKey(propertyTopicNames.stateTopic, propertyTopicData.topicStateKey);
      }

      if (propertyMessage !== undefined) {
        property.state!.value = await mqttRepository.convertMqttMessageToAliceValue(propertyMessage, propertyTopicData);
      }
    }

    return deviceClone;
  }
}

export default new DeviceHelper();
