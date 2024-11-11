/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */

/**
 * Config Interface.
 *
 * @interface
 */
export interface ConfigInterface {
  /**
   * The path to the view file for the "AuthController.login" action.
   *
   * @see AuthController.login
   * @example
   * yandexSmartHome(app, {
   *   viewAuthLogin: 'auth/login',
   * });
   */
  viewAuthLogin?: string;

  /**
   * The custom function to get the Client by ID.
   *
   * @see ClientRepository.getClientById
   * @example
   * yandexSmartHome(app, {
   *   functionGetClientById: async function (appId: number): Promise<ClientInterface> { ... },
   * });
   */
  functionGetClientById?: Function;

  /**
   * The custom function to get the Client by Client ID.
   *
   * @see ClientRepository.getClientByClientId
   * @example
   * yandexSmartHome(app, {
   *   functionGetClientByClientId: async function (clientId: string): Promise<ClientInterface> { ... },
   * });
   */
  functionGetClientByClientId?: Function;

  /**
   * The custom function to get the User by ID.
   *
   * @see UserRepository.getUserById
   * @example
   * yandexSmartHome(app, {
   *   functionGetUserById: async function (userId: string | number): Promise<UserInterface> { ... },
   * });
   */
  functionGetUserById?: Function;

  /**
   * The custom function to get the User by Email and Password.
   *
   * @see UserRepository.getUserByEmailAndPassword
   * @example
   * yandexSmartHome(app, {
   *   functionGetUserByEmailAndPassword: async function (email: string, password: string): Promise<UserInterface> { ... },
   * });
   */
  functionGetUserByEmailAndPassword?: Function;

  /**
   * The custom function to get the User by Name or Email.
   *
   * @see UserRepository.getUserByNameOrEmail
   * @example
   * yandexSmartHome(app, {
   *   functionGetUserByNameOrEmail: async function (nameOrEmail: string): Promise<UserInterface> { ... },
   * });
   */
  functionGetUserByNameOrEmail?: Function;

  /**
   * The custom function to get the User Devices.
   *
   * @see DeviceRepository.getUserDevices
   * @example
   * yandexSmartHome(app, {
   *   functionGetUserDevices: async function (user: UserInterface, configDevices: Device[]): Promise<Device[]> { ... },
   * });
   */
  functionGetUserDevices?: Function;

  /**
   * Adjust the MQTT Message if needed.
   *
   * @see MqttRepository.convertAliceValueToMqttMessage
   * @example
   * yandexSmartHome(app, {
   *   functionConvertAliceValueToMqttMessage: async function (
   *     aliceValue: any,
   *     mqttMessage: string,
   *     topicData?: CommandTopicData,
   *   ): Promise<string> { ... },
   * });
   */
  functionConvertAliceValueToMqttMessage?: Function;

  /**
   * Adjust the Alice Value if needed.
   *
   * @see MqttRepository.convertMqttMessageToAliceValue
   * @example
   * yandexSmartHome(app, {
   *   functionConvertMqttMessageToAliceValue: async function (
   *     mqttMessage: string,
   *     aliceValue: any,
   *     topicData?: CommandTopicData,
   *   ): Promise<any> { ... },
   * });
   */
  functionConvertMqttMessageToAliceValue?: Function;

  /**
   * Additional actions during the notification of unlinked accounts.
   *
   * @see RestUserController.unlink
   * @example
   * yandexSmartHome(app, {
   *   callbackRestUserUnlinkAction: async function (req: Request, res: Response): Promise<void> { ... },
   * });
   */
  callbackRestUserUnlinkAction?: Function;

  /**
   * Additional actions when returning a list of devices.
   *
   * @see RestUserController.devices
   * @example
   * yandexSmartHome(app, {
   *   callbackRestUserDevicesAction: async function (user: UserInterface, payloadDevices: Device[]): Promise<void> { ... },
   * });
   */
  callbackRestUserDevicesAction?: Function;

  /**
   * A callback method that can be used when Redis is Ready.
   *
   * @see RedisProvider.connect
   * @example
   * yandexSmartHome(app, {
   *   callbackRedisIsReady: function (client: RedisClientType): void { ... },
   * });
   */
  callbackRedisIsReady?: Function;

  /**
   * A callback method that can be used when MQTT Client is Subscribed.
   *
   * @see MqttProvider.subscribe
   * @example
   * yandexSmartHome(app, {
   *   callbackMqttIsSubscribed: function (client: mqtt.MqttClient): void { ... },
   * });
   */
  callbackMqttIsSubscribed?: Function;

  /**
   * The custom callback function for listening to the topics and handling them if needed.
   *
   * @see MqttProvider.listenTopic
   * @example
   * yandexSmartHome(app, {
   *   callbackListenTopic: function (topic: string, oldMessage: string | undefined, newMessage: string): void { ... },
   * });
   */
  callbackListenTopic?: Function;

  /**
   * Additional checks that the Skill Callback State can be sent to the Yandex server.
   *
   * @see SkillRepository.isCallbackStateAvailable
   * @example
   * yandexSmartHome(app, {
   *   callbackIsSkillCallbackStateAvailable: async function (
   *      topicData: TopicData,
   *      oldMessage: string | undefined,
   *      newMessage: string,
   *      result: boolean
   *   ): Promise<boolean> { ... },
   * });
   */
  callbackIsSkillCallbackStateAvailable?: Function;

  /**
   * Additional checks that the Skill Device can be sent to the Yandex server.
   *
   * @see SkillRepository.isDeviceAvailable
   * @example
   * yandexSmartHome(app, {
   *   callbackIsSkillDeviceAvailable: async function (
   *      user: UserInterface,
   *      device: Device,
   *      topicNames: MqttOutputTopicNames,
   *      result: boolean
   *   ): Promise<boolean> { ... },
   * });
   */
  callbackIsSkillDeviceAvailable?: Function;

  /**
   * Custom callback was called on success notification about the device state change.
   *
   * @see SkillRepository.callbackState
   * @example
   * yandexSmartHome(app, {
   *   callbackSkillState: async function (
   *      response: RequestOutput
   *      body: {[key: string]: any}
   *   ): Promise<boolean> { ... },
   * });
   */
  callbackSkillState?: Function;

  /**
   * Custom callback was called on success notification about the device parameter change.
   *
   * @see SkillRepository.callbackSkillDiscovery
   * @example
   * yandexSmartHome(app, {
   *   callbackSkillDiscovery: async function (
   *      response: RequestOutput
   *      body: {[key: string]: any}
   *   ): Promise<boolean> { ... },
   * });
   */
  callbackSkillDiscovery?: Function;

  /**
   * The config file with the user list. Each user should have "id", "email", and "password" fields.
   *
   * @see UserRepository.getConfigUsers
   * @example
   * yandexSmartHome(app, {
   *   configFileUsers: `${__dirname}/../config/users.json`,
   * });
   */
  configFileUsers?: string;

  /**
   * The config file with the device list.
   *
   * @see DeviceRepository.getConfigDevices
   * @example
   * yandexSmartHome(app, {
   *   configFileDevices: `${__dirname}/../config/devices.json`,
   * });
   */
  configFileDevices?: string;

  /**
   * The config file with the MQTT information (topics, etc.).
   *
   * @see MqttRepository.getConfig
   * @example
   * yandexSmartHome(app, {
   *   configFileMqtt: `${__dirname}/../config/mqtt.json`,
   * });
   */
  configFileMqtt?: string;

  [key: string]: any;
}
