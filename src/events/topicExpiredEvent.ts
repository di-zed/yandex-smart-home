/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Device } from '../devices/device';
import { RequestOutput } from '../providers/httpProvider';
import { UserInterface } from '../models/userModel';
import topicAnonUserRegistry from '../registry/topicAnonUserRegistry';
import userRepository from '../repositories/userRepository';
import deviceService from '../services/deviceService';
import mqttService, { TopicData } from '../services/mqttService';
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

    if (topicAnonUserRegistry.isUserAnonymous(topicData.userName)) {
      return false;
    }

    let user: UserInterface | undefined = undefined;

    try {
      user = await userRepository.getUserByNameOrEmail(topicData.userName);
    } catch (err) {
      topicAnonUserRegistry.markUserAsAnonymous(topicData.userName);
      return false;
    }

    try {
      const device: Device | undefined = await deviceService.getUserDeviceById(user.id, topicData.deviceId);
      if (device === undefined) {
        return false;
      }

      const updatedDevice: Device = await deviceService.updateUserDevice(user, device);
      const response: RequestOutput | boolean = await skillService.callbackState(user.id, [updatedDevice]);

      if (typeof response === 'object') {
        if (response.status !== 'ok') {
          if (response.status === 'error' && response.error_code === 'UNKNOWN_USER') {
            topicAnonUserRegistry.markUserAsAnonymous(topicData.userName);
          }
          return false;
        }
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }

    return true;
  }
}

export default new TopicExpiredEvent();
