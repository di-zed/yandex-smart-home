/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Device } from '../devices/device';
import { UserInterface } from '../models/userModel';
import configProvider from '../providers/configProvider';
import deviceRepository from '../repositories/deviceRepository';
import userRepository from '../repositories/userRepository';

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
}

export default new DeviceService();
