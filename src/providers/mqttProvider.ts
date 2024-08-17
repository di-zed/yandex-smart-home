/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import fs from 'fs';
import mqtt from 'mqtt';
import { IClientPublishOptions, ISubscriptionGrant } from 'mqtt/src/lib/client';
import { Packet } from 'mqtt-packet';
import { MqttInterface } from '../interfaces/mqttInterface';
import { RedisClientType } from 'redis';
import mqttRepository from '../repositories/mqttRepository';
import configProvider from './configProvider';
import redisProvider from './redisProvider';

/**
 * MQTT Provider.
 */
export class MqttProvider {
  /**
   * MQTT Client.
   *
   * @protected
   */
  protected client: mqtt.MqttClient | undefined = undefined;

  /**
   * Get MQTT Client.
   *
   * @returns mqtt.MqttClient | undefined
   */
  public getClient(): mqtt.MqttClient | undefined {
    return this.client;
  }

  /**
   * Get MQTT Client.
   * Async method with reconnect possibility.
   *
   * @returns Promise<mqtt.MqttClient>
   */
  public async getClientAsync(): Promise<mqtt.MqttClient> {
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
    const port: number = parseInt(process.env.MQTT_CONTAINER_PORT as string, 10);
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

    this.client = await mqtt.connectAsync(host, options);
    return this.client;
  }

  /**
   * Subscribe to a topic or topics.
   *
   * @param eventMessageCallback
   * @returns Promise<ISubscriptionGrant[]>
   * @see https://github.com/mqttjs/MQTT.js?tab=readme-ov-file#mqttclientsubscribeasynctopictopic-arraytopic-object-options
   */
  public async subscribe(eventMessageCallback: Function): Promise<ISubscriptionGrant[]> {
    const config: MqttInterface = await mqttRepository.getConfig();

    const client: mqtt.MqttClient = await this.getClientAsync();
    const result: Promise<ISubscriptionGrant[]> = client.subscribeAsync(config.subscribeTopic);

    client.on('message', (topic: string, message: Buffer) => {
      eventMessageCallback(topic as string, String(message) as string);
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
    const client: mqtt.MqttClient = await this.getClientAsync();
    return await client.publishAsync(topic, message, opts);
  }

  /**
   * Close the client.
   *
   * @returns Promise<void>
   * @see https://github.com/mqttjs/MQTT.js?tab=readme-ov-file#mqttclientendasyncforce-options
   */
  public async end(): Promise<void> {
    const client: mqtt.MqttClient = await this.getClientAsync();
    return await client.endAsync();
  }

  /**
   * Set Topic Message to the Cache.
   *
   * @param topic
   * @param message
   * @returns Promise<boolean>
   */
  public async setTopicMessage(topic: string, message: string): Promise<boolean> {
    const redisClient: RedisClientType = await redisProvider.getClientAsync();
    const result: number = await redisClient.hSet('topics', topic, message);

    return result > 0;
  }

  /**
   * Get Topic Message from the Cache.
   *
   * @param topic
   * @returns Promise<string | undefined>
   */
  public async getTopicMessage(topic: string): Promise<string | undefined> {
    const redisClient: RedisClientType = await redisProvider.getClientAsync();
    const value: string | undefined | null = await redisClient.hGet('topics', topic);

    return value !== undefined && value !== null ? value : undefined;
  }

  /**
   * Listen Topic.
   *
   * @param topic
   * @param message
   * @returns void
   */
  public listenTopic(topic: string, message: string): void {
    if (process.env.NODE_ENV === 'development' && process.env.LOG_LISTEN_TOPIC === '1') {
      console.log(topic, '>>', message);
    }

    const callbackListenTopic = configProvider.getConfigOption('callbackListenTopic');
    if (typeof callbackListenTopic === 'function') {
      callbackListenTopic(topic, message);
    }
  }
}

export default new MqttProvider();
