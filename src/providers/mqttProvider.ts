/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import fs from 'fs';
import mqtt from 'mqtt';
import { IClientPublishOptions, ISubscriptionGrant } from 'mqtt/src/lib/client';
import { Packet } from 'mqtt-packet';
import { MqttInterface } from '../interfaces/mqttInterface';
import mqttRepository from '../repositories/mqttRepository';
import configProvider from './configProvider';

/**
 * MQTT Provider.
 */
export class MqttProvider {
  /**
   * MQTT Client.
   *
   * @protected
   */
  protected client: mqtt.MqttClient | undefined;

  /**
   * Cached Topic Messages.
   *
   * @protected
   */
  protected cacheTopicMessages: CacheTopicMessage = {};

  /**
   * Get MQTT Client.
   *
   * @returns Promise<mqtt.MqttClient>
   */
  public async getClient(): Promise<mqtt.MqttClient> {
    if (this.client === undefined) {
      this.client = await this.connect();
    }

    return this.client;
  }

  /**
   * By default, client connects when constructor is called.
   * To prevent this you can set "manualConnect" option to "true" and call "client.connect()" manually.
   *
   * @returns Promise<mqtt.MqttClient>
   * @see https://github.com/mqttjs/MQTT.js?tab=readme-ov-file#connect-async
   */
  public async connect(): Promise<mqtt.MqttClient> {
    const options: { [key: string]: any } = {};

    const host: string = (process.env.MQTT_HOST as string).trim();
    const port: number = parseInt(process.env.MQTT_PORT as string, 10);
    const username: string = (process.env.MQTT_USERNAME as string).trim();
    const password: string = (process.env.MQTT_PASSWORD as string).trim();
    const clientId: string = (process.env.MQTT_CLIENT_ID as string).trim();
    const ca: string = (process.env.MQTT_CA as string).trim();
    const cert: string = (process.env.MQTT_CERT as string).trim();
    const key: string = (process.env.MQTT_KEY as string).trim();
    const rejectUnauthorized: string = (process.env.MQTT_REJECT_UNAUTHORIZED as string).trim();

    if (port) {
      options.port = port;
    }
    if (username) {
      options.username = username;
    }
    if (password) {
      options.password = password;
    }
    if (clientId) {
      options.clientId = clientId;
    }
    if (ca) {
      options.ca = fs.readFileSync(ca);
    }
    if (cert) {
      options.cert = fs.readFileSync(cert);
    }
    if (key) {
      options.key = fs.readFileSync(key);
    }
    if (rejectUnauthorized) {
      options.rejectUnauthorized = rejectUnauthorized === '1';
    }

    return await mqtt.connectAsync(host, options);
  }

  /**
   * Subscribe to a topic or topics.
   *
   * @param handlerFunction
   * @returns Promise<ISubscriptionGrant[]>
   * @see https://github.com/mqttjs/MQTT.js?tab=readme-ov-file#mqttclientsubscribeasynctopictopic-arraytopic-object-options
   */
  public async subscribe(handlerFunction: Function): Promise<ISubscriptionGrant[]> {
    const config: MqttInterface = await mqttRepository.getConfig();

    const client: mqtt.MqttClient = await this.getClient();
    const result: Promise<ISubscriptionGrant[]> = client.subscribeAsync(config.subscribeTopic);

    client.on('message', async (topic: string, message: Buffer) => {
      await handlerFunction(topic as string, String(message) as string);
    });

    return result;
  }

  /**
   * Publish a message to a topic.
   *
   * @param topic
   * @param message
   * @param opts
   * @returns Promise<Packet | undefined>
   * @see https://github.com/mqttjs/MQTT.js?tab=readme-ov-file#mqttclientpublishasynctopic-message-options
   */
  public async publish(topic: string, message: string | Buffer, opts?: IClientPublishOptions): Promise<Packet | undefined> {
    const client: mqtt.MqttClient = await this.getClient();
    return await client.publishAsync(topic, message, opts);
  }

  /**
   * Close the client.
   *
   * @returns Promise<void>
   * @see https://github.com/mqttjs/MQTT.js?tab=readme-ov-file#mqttclientendasyncforce-options
   */
  public async end(): Promise<void> {
    const client: mqtt.MqttClient = await this.getClient();
    return await client.endAsync();
  }

  /**
   * Set Topic Message to the Cache.
   *
   * @param topic
   * @param message
   * @returns boolean
   */
  public setTopicMessage(topic: string, message: string): boolean {
    this.cacheTopicMessages[topic] = message;
    return true;
  }

  /**
   * Get Topic Message from the Cache.
   *
   * @param topic
   * @returns string | undefined
   */
  public getTopicMessage(topic: string): string | undefined {
    return this.cacheTopicMessages[topic];
  }

  /**
   * Listen Topic.
   *
   * @param topic
   * @param message
   * @returns Promise<boolean>
   */
  public async listenTopic(topic: string, message: string): Promise<boolean> {
    if (process.env.NODE_ENV === 'development' && process.env.LOG_LISTEN_TOPIC === '1') {
      console.log(topic, '>>', message);
    }

    const functionListenTopic = configProvider.getConfigOption('functionListenTopic');
    if (typeof functionListenTopic === 'function') {
      return (await functionListenTopic(topic, message)) as boolean;
    }

    return true;
  }
}

/**
 * Cache Topic Message type.
 */
export type CacheTopicMessage = {
  [key: string]: string;
};

export default new MqttProvider();
