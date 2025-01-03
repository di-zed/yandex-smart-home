/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Device } from '../devices/device';
import { RequestOutput } from '../providers/httpProvider';
import { UserInterface } from '../models/userModel';
import userRepository from '../repositories/userRepository';
import deviceService from '../services/deviceService';
import mqttService, { MqttOutputTopicNames, TopicData } from '../services/mqttService';
import skillService from '../services/skillService';

/**
 * Topic Expired Event.
 */
class TopicExpiredEvent {
  /**
   * Event executor.
   *
   * @param topic
   * @param message
   * @returns Promise<boolean>
   */
  public async execute(topic: string, message: string): Promise<boolean> {
    const topicData: TopicData | undefined = await mqttService.getTopicData(topic);
    if (topicData === undefined || topicData.topicType !== 'stateTopic') {
      return false;
    }

    try {
      const user: UserInterface = await userRepository.getUserByNameOrEmail(topicData.userName);

      const device: Device | undefined = await deviceService.getUserDeviceById(user.id, topicData.deviceId);
      if (device === undefined) {
        return false;
      }

      const updatedDevice: Device = await deviceService.updateUserDevice(user, device);

      const response: RequestOutput | boolean = await skillService.callbackState(user.id, [updatedDevice]);
      if (typeof response !== 'object' || response.status !== 'ok') {
        return false;
      }
    } catch (err) {
      return false;
    }

    return true;
  }
}

export default new TopicExpiredEvent();
