/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import fs from 'fs';
import { Device } from '../devices/device';
import { UserInterface } from '../models/userModel';
import userRepository from './userRepository';
import configProvider from '../providers/configProvider';

/**
 * Device Repository.
 */
class DeviceRepository {
  /**
   * Cached Config Devices.
   *
   * @protected
   */
  protected configDevices: Device[] | undefined;

  /**
   * Get Devices by User ID.
   *
   * @param userId
   * @returns Promise<Device[]>
   */
  public async getUserDevices(userId: string | number): Promise<Device[]> {
    const user: UserInterface = await userRepository.getUserById(userId);
    const devices: Device[] = await this.getConfigDevices();

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
   * Get Device by Device Model.
   *
   * @param deviceModel
   * @returns Promise<Device | undefined>
   */
  public async getDeviceByModel(deviceModel: string): Promise<Device | undefined> {
    const devices: Device[] = await this.getConfigDevices();
    return devices.find((element: Device): boolean => element.device_info?.model === deviceModel);
  }

  /**
   * Get Device Type by Device Model.
   *
   * @param deviceModel
   * @returns Promise<string>
   */
  public async getDeviceTypeByModel(deviceModel: string): Promise<string> {
    const device: Device | undefined = await this.getDeviceByModel(deviceModel);
    return device?.type ? device.type : '';
  }

  /**
   * Get Devices from the Configuration file.
   *
   * @returns Promise<Device[]>
   */
  public async getConfigDevices(): Promise<Device[]> {
    try {
      if (this.configDevices === undefined) {
        const configFileDevices = configProvider.getConfigOption('configFileDevices');
        const filePath = configFileDevices ? configFileDevices : `${__dirname}/../../config/devices.json`;
        this.configDevices = await JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }));
      }
      return <Device[]>this.configDevices;
    } catch (err) {
      return [];
    }
  }
}

export default new DeviceRepository();
