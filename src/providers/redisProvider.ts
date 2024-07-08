/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import fs from 'fs';
import { createClient, RedisClientType } from 'redis';

/**
 * Redis Provider.
 */
export class RedisProvider {
  /**
   * Redis Client.
   *
   * @protected
   */
  protected client: RedisClientType | undefined = undefined;

  /**
   * Get Redis Client.
   */
  public async getClient(): Promise<RedisClientType> {
    if (this.client === undefined) {
      this.client = await this.connect();
    }

    return this.client;
  }

  /**
   * Connection.
   *
   * @returns Promise<RedisClientType>
   * @see https://github.com/redis/node-redis?tab=readme-ov-file#usage
   */
  public async connect(): Promise<RedisClientType> {
    const username: string = (process.env.REDIS_USERNAME as string).trim();
    const password: string = (process.env.REDIS_PASSWORD as string).trim();
    const host: string = (process.env.REDIS_HOST as string).trim();
    const port: number = parseInt(process.env.REDIS_CONTAINER_PORT as string, 10);
    const dbNumber: number = parseInt(process.env.REDIS_DB_NUMBER as string, 10);
    const tls: string = (process.env.REDIS_TLS as string).trim();
    const ca: string = (process.env.REDIS_CA as string).trim();
    const cert: string = (process.env.REDIS_CERT as string).trim();
    const key: string = (process.env.REDIS_KEY as string).trim();
    const rejectUnauthorized: string = (process.env.REDIS_REJECT_UNAUTHORIZED as string).trim();

    let connectionString: string = tls === '1' ? 'rediss://' : 'redis://';

    if (username && password) {
      connectionString += username + ':' + password + '@';
    }
    connectionString += host + ':' + port;
    if (!isNaN(dbNumber)) {
      connectionString += '/' + dbNumber;
    }

    const socketOptions: { [key: string]: any } = {};
    if (tls === '1') {
      socketOptions.tls = true;
      if (ca) {
        socketOptions.ca = fs.readFileSync(ca);
      }
      if (cert) {
        socketOptions.cert = fs.readFileSync(cert);
      }
      if (key) {
        socketOptions.key = fs.readFileSync(key);
      }
      if (rejectUnauthorized) {
        socketOptions.rejectUnauthorized = rejectUnauthorized === '1';
      }
    }

    const client: RedisClientType = createClient({
      url: connectionString,
      socket: socketOptions,
    });

    client.on('error', (err) => console.log(err));
    // client.on('connect', () => console.log('Redis Connected!'));
    // client.on('reconnecting', () => console.log('Redis Reconnecting...'));
    // client.on('ready', () => console.log('Redis Ready!'));

    return await client.connect();
  }

  /**
   * Get value.
   *
   * @param key
   * @returns Promise<any>
   */
  public async getValue(key: string): Promise<any> {
    const client: RedisClientType = await this.getClient();

    if (await client.exists(key)) {
      return await client.get(key);
    }

    return undefined;
  }

  /**
   * Set value.
   *
   * @param key
   * @param value
   * @param options
   * @returns Promise<string | null>
   */
  public async setValue(key: string, value: any, options: { [key: string]: any } = {}): Promise<string | null> {
    const client: RedisClientType = await this.getClient();
    return await client.set(key, value, options);
  }
}

export default new RedisProvider();
