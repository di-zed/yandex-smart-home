/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Device } from '../devices/device';
import { UserInterface } from '../models/userModel';
import skillService from '../services/skillService';

/**
 * REST User Devices After Event.
 */
class RestUserDevicesAfterEvent {
  /**
   * Event executor.
   * Additional actions when returning a list of devices.
   *
   * @param user
   * @param devices
   * @returns Promise<boolean>
   */
  public async execute(user: UserInterface, devices: Device[]): Promise<boolean> {
    // The event must be executed after Yandex receives a response from the server.
    setTimeout((): void => {
      skillService.execTempUserStateCallback(user, devices).catch((err: any): void => {
        console.log('ERROR! REST User Devices After Event, User State Callback.', { err, user, devices });
      });
    }, 1000);

    return true;
  }
}

export default new RestUserDevicesAfterEvent();
