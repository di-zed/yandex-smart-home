/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Capability } from '../devices/capability';
import { Property } from '../devices/property';
import { Device } from '../devices/device';

/**
 * Device Helper.
 */
class DeviceHelper {
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
