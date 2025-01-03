/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Device } from '../devices/device';
import { MqttCommandTopicInterface, MqttTopicInterface } from '../interfaces/mqttInterface';
import { UserInterface } from '../models/userModel';
import mqttRepository from '../repositories/mqttRepository';
import deviceService from './deviceService';

/**
 * MQTT Service.
 */
class MqttService {
  /**
   * Get Topic Names.
   *
   * @param input
   * @returns Promise<MqttOutputTopicNames>
   */
  public async getTopicNames(input: MqttInputTopicNames): Promise<MqttOutputTopicNames> {
    const topicNames: MqttOutputTopicNames = {
      stateTopic: '',
      configTopic: '',
      availableTopic: '',
      commandTopic: '',
    };

    let deviceType: string = '';
    (await deviceService.getUserDevices(input.user.id)).forEach((userDevice: Device): void => {
      if (userDevice.id === input.deviceId) {
        deviceType = userDevice.type ? userDevice.type : '';
      }
    });

    (await mqttRepository.getConfigTopics()).forEach((topicData: MqttTopicInterface): void => {
      if (topicData.deviceType === deviceType) {
        topicNames.stateTopic = this.handleTopicName(topicData.stateTopic, input.user, input.deviceId);
        topicNames.configTopic = this.handleTopicName(topicData.configTopic, input.user, input.deviceId);
        topicNames.availableTopic = this.handleTopicName(topicData.availableTopic, input.user, input.deviceId);
        topicData.commandTopics.forEach((commandTopicData: MqttCommandTopicInterface): void => {
          const typeState: MqttTopicTypeState = {
            capabilityType: input.capabilityType,
            capabilityStateInstance: input.capabilityStateInstance,
            propertyType: input.propertyType,
            propertyStateInstance: input.propertyStateInstance,
          };

          if (this.matchTopicTypeState(commandTopicData, typeState)) {
            topicNames.commandTopic = this.handleTopicName(commandTopicData.topic, input.user, input.deviceId);
          }
        });
      }
    });

    return topicNames;
  }

  /**
   * Get Data from the Topic.
   *
   * @param topic
   * @param typeState
   * @returns Promise<TopicData | undefined>
   */
  public async getTopicData(topic: string, typeState?: MqttTopicTypeState): Promise<TopicData | undefined> {
    let result: TopicData | undefined = undefined;
    const configTopics: MqttTopicInterface[] = await mqttRepository.getConfigTopics();

    configTopics.every((item: MqttTopicInterface): boolean => {
      const stateTopic: ParsedTopicName | undefined = this.parseTopicName(item.stateTopic, topic);
      if (stateTopic !== undefined) {
        result = { ...stateTopic, ...{ topicType: 'stateTopic' } };
        return false;
      }

      const configTopic: ParsedTopicName | undefined = this.parseTopicName(item.configTopic, topic);
      if (configTopic !== undefined) {
        result = { ...configTopic, ...{ topicType: 'configTopic' } };
        return false;
      }

      const availableTopic: ParsedTopicName | undefined = this.parseTopicName(item.availableTopic, topic);
      if (availableTopic !== undefined) {
        result = { ...availableTopic, ...{ topicType: 'availableTopic' } };
        return false;
      }

      let isCommandTopic: boolean = false;
      item.commandTopics.every((itemCommandTopic: MqttCommandTopicInterface): boolean => {
        const commandTopic: ParsedTopicName | undefined = this.parseTopicName(itemCommandTopic.topic, topic);
        if (commandTopic !== undefined) {
          if (typeState && !this.matchTopicTypeState(itemCommandTopic, typeState)) {
            return true;
          }

          result = { ...commandTopic, ...{ topicType: 'commandTopic' } };
          isCommandTopic = true;
          return false;
        }
        return true;
      });

      return !isCommandTopic;
    });

    return result;
  }

  /**
   * Get Data from the Command Topic.
   *
   * @param topic
   * @param deviceType
   * @param typeState
   * @returns Promise<CommandTopicData | undefined>
   */
  public async getCommandTopicData(topic: string, deviceType: string, typeState?: MqttTopicTypeState): Promise<CommandTopicData | undefined> {
    let result: CommandTopicData | undefined = undefined;

    const configTopics: MqttTopicInterface[] = await mqttRepository.getConfigTopics();

    configTopics.forEach((configTopic: MqttTopicInterface): void => {
      if (configTopic.deviceType === deviceType) {
        configTopic.commandTopics.every((commandTopic: MqttCommandTopicInterface): boolean => {
          const parsedTopicName: ParsedTopicName | undefined = this.parseTopicName(commandTopic.topic, topic);

          if (parsedTopicName !== undefined) {
            if (typeState && !this.matchTopicTypeState(commandTopic, typeState)) {
              return true;
            }

            result = {
              deviceId: parsedTopicName.deviceId,
              deviceType: configTopic.deviceType,
              capabilityType: commandTopic.capability?.type ? commandTopic.capability.type : '',
              capabilityStateInstance: commandTopic.capability?.stateInstance ? commandTopic.capability.stateInstance : '',
              propertyType: commandTopic.property?.type ? commandTopic.property.type : '',
              propertyStateInstance: commandTopic.property?.stateInstance ? commandTopic.property.stateInstance : '',
              topicStateKeys: commandTopic.topicStateKeys || [],
              messageValueMapping: commandTopic.messageValueMapping || {},
              userName: parsedTopicName.userName,
            };
            return false;
          }
          return true;
        });
      }
    });

    return result;
  }

  /**
   * Check the Topic Type.
   *
   * @param topic
   * @param expectedType
   * @returns Promise<boolean>
   */
  public async isTopicType(topic: string, expectedType: MqttTopicTypes): Promise<boolean> {
    let result: boolean = false;
    const configTopics: MqttTopicInterface[] = await mqttRepository.getConfigTopics();

    configTopics.every(async (item: MqttTopicInterface): Promise<boolean> => {
      if (expectedType === 'commandTopic') {
        item.commandTopics.every(async (commandItem: MqttCommandTopicInterface): Promise<boolean> => {
          const commandTopicName: ParsedTopicName | undefined = this.parseTopicName(commandItem.topic, topic);
          if (commandTopicName !== undefined) {
            result = true;
            return false;
          }
          return true;
        });
        return !result;
      } else {
        const topicName: ParsedTopicName | undefined = this.parseTopicName(item[expectedType], topic);
        if (topicName !== undefined) {
          result = true;
          return false;
        }
      }
      return true;
    });

    return result;
  }

  /**
   * Get Parsed Information from the Topic Name.
   *
   * @param patternTopic
   * @param topic
   * @returns ParsedTopicName | undefined
   */
  public parseTopicName(patternTopic: string, topic: string): ParsedTopicName | undefined {
    const pattern: string = patternTopic.replace('<user_name>', '([^/]*)').replace('<device_id>', '([^/]*)');
    const re: RegExp = new RegExp('^' + pattern + '$', 'g');

    const match: RegExpExecArray | null = re.exec(topic);
    if (match) {
      return <ParsedTopicName>{
        userName: match[1],
        deviceId: match[2],
      };
    }

    return undefined;
  }

  /**
   * Get Username for the MQTT Topic.
   *
   * @param user
   * @returns string
   */
  public getTopicUserName(user: UserInterface): string {
    // return user.fullName ? user.fullName.replace(/\s/g, '_') : user.email;
    return user.email;
  }

  /**
   * Handle Topic Name.
   *
   * @param topicName
   * @param user
   * @param deviceId
   * @returns string
   */
  public handleTopicName(topicName: string, user: UserInterface, deviceId: string): string {
    return topicName.replace('<user_name>', this.getTopicUserName(user)).replace('<device_id>', deviceId);
  }

  /**
   * Match Type & State Instance.
   *
   * @param commandTopic
   * @param typeState
   * @returns boolean
   */
  public matchTopicTypeState(commandTopic: MqttCommandTopicInterface, typeState: MqttTopicTypeState): boolean {
    if (typeState.capabilityType && typeState.capabilityStateInstance) {
      if (
        commandTopic.capability?.type === typeState.capabilityType &&
        commandTopic.capability?.stateInstance === typeState.capabilityStateInstance
      ) {
        return true;
      }
    }

    if (typeState.propertyType && typeState.propertyStateInstance) {
      if (commandTopic.property?.type === typeState.propertyType && commandTopic.property?.stateInstance === typeState.propertyStateInstance) {
        return true;
      }
    }

    return false;
  }
}

/**
 * MQTT Topic "Type & State Instance" Type.
 */
export type MqttTopicTypeState = {
  capabilityType?: string;
  capabilityStateInstance?: string;
  propertyType?: string;
  propertyStateInstance?: string;
};

/**
 * MQTT Input Topic Names Type.
 */
export type MqttInputTopicNames = MqttTopicTypeState & {
  user: UserInterface;
  deviceId: string;
};

/**
 * MQTT Output Topic Names Type.
 */
export type MqttOutputTopicNames = {
  stateTopic: string;
  configTopic: string;
  availableTopic: string;
  commandTopic: string;
};

/**
 * MQTT Topic Types.
 */
export type MqttTopicTypes = 'stateTopic' | 'configTopic' | 'availableTopic' | 'commandTopic';

/**
 * Parsed Information from the Topic Name.
 */
export type ParsedTopicName = {
  userName: string;
  deviceId: string;
};

/**
 * Data from the Topic.
 */
export type TopicData = ParsedTopicName & {
  topicType: MqttTopicTypes;
};

/**
 * Data from the Command Topic.
 */
export type CommandTopicData = ParsedTopicName & {
  deviceType: string;
  capabilityType: string;
  capabilityStateInstance: string;
  propertyType: string;
  propertyStateInstance: string;
  topicStateKeys: string[];
  messageValueMapping: { [key: string]: any };
};

export default new MqttService();
