/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import express, { Application } from 'express';
import expressRuid from 'express-ruid';
import path from 'path';
import cookieParser from 'cookie-parser';
import i18n from 'i18n';
import helmet from 'helmet';
import morgan from 'morgan';
import hpp from 'hpp';
import configProvider from './providers/configProvider';
import mqttProvider from './providers/mqttProvider';
import redisProvider from './providers/redisProvider';
import skillRepository from './repositories/skillRepository';
import Routes from './routes';
import { ConfigInterface } from './interfaces/configInterface';
import { ISubscriptionGrant } from 'mqtt/src/lib/client';

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

    // Serving static files.
    app.use(express.static(path.join(__dirname, 'public')));

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
        contentSecurityPolicy: {
          directives: {
            scriptSrc: ["'self'", 'cdn.jsdelivr.net'],
            'form-action': null, // @todo It should be like ["'self'", 'social.yandex.net'] but it doesn't work on mobile.
          },
        },
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
    redisProvider.connect().then((): void => {
      this.subscribeMqtt();
    });
  }

  /**
   * MQTT Subscriber.
   *
   * @protected
   */
  protected subscribeMqtt(): void {
    mqttProvider.connect().then((): void => {
      mqttProvider
        .subscribe((topic: string, newMessage: string): void => {
          try {
            mqttProvider.getTopicMessage(topic).then((oldMessage: string | undefined): void => {
              if (oldMessage !== newMessage) {
                mqttProvider.setTopicMessage(topic, newMessage).then((): void => {
                  mqttProvider.listenTopic(topic, oldMessage, newMessage);
                  skillRepository.callbackState(topic, oldMessage, newMessage).catch((err) => {
                    console.log('ERROR! Skill Callback State.', { err, topic, oldMessage, newMessage });
                  });
                });
              }
            });
          } catch (err) {
            console.log('ERROR! MQTT Subscribe.', { err, topic, newMessage });
          }
        })
        .then((subscriptionGrants: ISubscriptionGrant[]): void => {
          const callbackMqttIsSubscribed = configProvider.getConfigOption('callbackMqttIsSubscribed');
          if (typeof callbackMqttIsSubscribed === 'function') {
            callbackMqttIsSubscribed(mqttProvider.getClient());
          }
          console.log('MQTT is Subscribed!', subscriptionGrants);
        });
    });
  }
}

export default function (app: Application, config: ConfigInterface): YandexSmartHome {
  return new YandexSmartHome(app, config);
}
