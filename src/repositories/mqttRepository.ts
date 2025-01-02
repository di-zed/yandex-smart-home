/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import fs from 'fs';
import { MqttInterface, MqttTopicInterface } from '../interfaces/mqttInterface';
import configProvider from '../providers/configProvider';

/**
 * MQTT Repository.
 */
class MqttRepository {
  /**
   * Cached Config.
   *
   * @protected
   */
  protected config: MqttInterface | undefined;

  /**
   * Get MQTT information from the Configuration file.
   *
   * @returns Promise<MqttInterface>
   */
  public async getConfig(): Promise<MqttInterface> {
    if (this.config === undefined) {
      const configFileMqtt = configProvider.getConfigOption('configFileMqtt');
      const filePath = configFileMqtt ? configFileMqtt : `${__dirname}/../../config/mqtt.json`;
      this.config = await JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }));
    }

    return <MqttInterface>this.config;
  }

  /**
   * Get Topics from the Configuration file.
   *
   * @returns Promise<MqttTopicInterface[]>
   */
  public async getConfigTopics(): Promise<MqttTopicInterface[]> {
    try {
      const config: MqttInterface = await this.getConfig();
      return config.topics;
    } catch (err) {
      return [];
    }
  }
}

export default new MqttRepository();
