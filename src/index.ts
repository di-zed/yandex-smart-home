/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import express, { Application } from 'express';
import expressRuid from 'express-ruid';
import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import i18n from 'i18n';
import helmet from 'helmet';
import morgan from 'morgan';
import hpp from 'hpp';
import configProvider from './providers/configProvider';
import mqttProvider from './providers/mqttProvider';
import redisProvider from './providers/redisProvider';
import Routes from './routes';
import { ConfigInterface } from './interfaces/configInterface';

/**
 * Bootstrap Class.
 */
class YandexSmartHome {
  /**
   * Yandex Smart Home Index.
   *
   * @param app
   * @param config
   */
  public constructor(app: Application, config: ConfigInterface) {
    configProvider.setConfig(config);

    this.setConfig(app);
    this.connectRedis();

    new Routes(app);
  }

  /**
   * Set Configurations.
   *
   * @param app
   * @protected
   */
  protected setConfig(app: Application): void {
    dotenv.config({ path: './.env' });

    // Parse Cookie header and populate req.cookies with an object keyed by the cookie names.
    app.use(cookieParser());

    // Lightweight simple translation module with dynamic JSON storage.
    i18n.configure({
      locales: ['ru'],
      defaultLocale: 'ru',
      directory: path.join(__dirname, 'locales'),
    });
    app.use(i18n.init);

    // Set view engine.
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    // Generates UUID for request and add it to header.
    app.use(
      expressRuid({
        setInContext: true,
        header: 'X-Request-Id',
        attribute: 'requestId',
      }),
    );

    // Helmet helps secure Express apps by setting HTTP response headers.
    app.use(
      helmet({
        contentSecurityPolicy: !(process.env.NODE_ENV === 'development'),
      }),
    );

    // HTTP request logger middleware for Node.js.
    if (process.env.NODE_ENV === 'development') {
      app.use(morgan('dev'));
    }

    // It parses incoming requests with JSON payloads and is based on body-parser.
    app.use(express.json({ limit: '10kb' }));

    // It parses incoming requests with URL-encoded payloads and is based on a body parser.
    app.use(
      express.urlencoded({
        extended: true,
        limit: '10kb',
      }),
    );

    // Node.js Connect middleware to sanitize user input coming from POST body, GET queries, and URL params.
    require('xss-clean')();

    // Express middleware to protect against HTTP Parameter Pollution attacks.
    app.use(hpp());
  }

  /**
   * Redis Connection.
   *
   * @protected
   */
  protected connectRedis(): void {
    redisProvider.getClient().then((): void => {
      console.log('Redis connected!');
      this.subscribeMqtt();
    });
  }

  /**
   * MQTT Subscriber.
   *
   * @protected
   */
  protected subscribeMqtt(): void {
    mqttProvider.getClient().then(() => {
      mqttProvider
        .subscribe(async (topic: string, message: string) => {
          try {
            await this.listenTopic(topic, message);
          } catch (err) {
            console.log(err, topic, message);
          }
        })
        .then((result) => {
          console.log('MQTT subscribed!', result);
        });
    });
  }

  /**
   * Listen Topic.
   *
   * @param topic
   * @param message
   * @returns Promise<boolean>
   */
  private async listenTopic(topic: string, message: string): Promise<boolean> {
    await mqttProvider.setTopicMessage(topic, message);
    await mqttProvider.listenTopic(topic, message);

    return true;
  }
}

export default function (app: Application, config: ConfigInterface): YandexSmartHome {
  return new YandexSmartHome(app, config);
}
