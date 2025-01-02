/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import fs from 'fs';
import { Device } from '../devices/device';
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
