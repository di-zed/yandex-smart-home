/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { NextFunction, Request, Response } from 'express';
import { DevicesResponse } from '../../devices/response';
import configProvider from '../../providers/configProvider';
import mqttProvider from '../../providers/mqttProvider';
import deviceRepository from '../../repositories/deviceRepository';
import mqttRepository, { CommandTopicData, MqttInputTopicNames, MqttOutputTopicNames } from '../../repositories/mqttRepository';
import catchAsync from '../../errors/catchAsync';
import { Device } from '../../devices/device';
import { Capability, CapabilityState, CapabilityStateActionResult } from '../../devices/capability';
import { Property, PropertyState } from '../../devices/property';
import { RangeCapabilityState } from '../../devices/capabilities/rangeCapability';
import AppError from '../../errors/appError';

/**
 * REST User Controller.
 */
export default class RestUserController {
  /**
   * POST Method.
   * Notification of unlinked accounts.
   * https://yandex.ru/dev/dialogs/smart-home/doc/reference/unlink.html?lang=en
   *
   * @param req
   * @param res
   * @returns Response
   */
  public unlink = catchAsync(async (req: Request, res: Response): Promise<Response> => {
    console.log(
      res.__(
        "The user's provider account (#%s) and Yandex account (#%s) were unlinked (the link between them was deleted by the user).",
        String(req.currentUser.id),
        String(req.currentClient.id),
      ),
    );

    const functionRestUserUnlinkAction = configProvider.getConfigOption('functionRestUserUnlinkAction');
    if (typeof functionRestUserUnlinkAction === 'function') {
      await functionRestUserUnlinkAction(req, res);
    }

    return res.status(200).json({
      request_id: req.requestId,
    });
  });

  /**
   * GET Method.
   * Information about user devices.
   * https://yandex.ru/dev/dialogs/smart-home/doc/reference/get-devices.html?lang=en
   *
   * @param req
   * @param res
   * @returns Response
   */
  public devices = catchAsync(async (req: Request, res: Response): Promise<Response> => {
    const devices: Device[] = await deviceRepository.getUserDevices(req.currentUser.id);

    const response: DevicesResponse = {
      request_id: req.requestId,
      payload: {
        user_id: String(req.currentUser.id),
        devices: JSON.parse(JSON.stringify(devices)),
      },
    };

    response.payload.devices.forEach((device: Device): void => {
      device.capabilities?.forEach((capability: Capability): void => {
        delete capability.state;
      });
      device.properties?.forEach((property: Property): void => {
        delete property.state;
      });
    });

    return res.status(200).json(response);
  });

  /**
   * POST Method.
   * Information about the states of user devices.
   * https://yandex.ru/dev/dialogs/smart-home/doc/reference/post-devices-query.html?lang=en
   *
   * @param req
   * @param res
   * @returns Response
   */
  public devicesQuery = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    if (typeof req.body.devices !== 'object') {
      return next(new AppError(res.__('Page Not Found.'), 404));
    }

    const response: DevicesResponse = {
      request_id: req.requestId,
      payload: {
        devices: JSON.parse(JSON.stringify(req.body.devices)),
      },
    };

    for (const payloadDevice of <Device[]>response.payload.devices) {
      const userDevice: Device | undefined = await deviceRepository.getUserDeviceById(req.currentUser.id, payloadDevice.id);
      if (userDevice === undefined) {
        payloadDevice.error_code = 'DEVICE_NOT_FOUND';
        payloadDevice.error_message = res.__('The device "%s" can not be found.', payloadDevice.id);
        continue;
      }

      payloadDevice.capabilities = [];
      const payloadCapabilities: Capability[] = userDevice?.capabilities ? userDevice.capabilities : [];

      for (const payloadCapabily of payloadCapabilities) {
        const capabilityState: CapabilityState = <CapabilityState>payloadCapabily.state;
        const capabilityTopicNames: MqttOutputTopicNames = await mqttRepository.getTopicNames(<MqttInputTopicNames>{
          user: req.currentUser,
          deviceId: userDevice.id,
          capabilityType: payloadCapabily.type,
          capabilityStateInstance: capabilityState.instance,
        });

        let topicData: CommandTopicData | undefined = undefined;

        const capabilityMessage: string | undefined = mqttProvider.getTopicMessage(capabilityTopicNames.commandTopic);

        if (capabilityMessage !== undefined) {
          if (userDevice?.type) {
            topicData = await mqttRepository.getCommandTopicData(capabilityTopicNames.commandTopic, userDevice.type, {
              capabilityType: payloadCapabily.type,
              capabilityStateInstance: capabilityState.instance,
            });
          }
          capabilityState.value = await mqttRepository.convertMqttMessageToAliceValue(capabilityMessage, topicData);
        }

        payloadDevice.capabilities.push(<Capability>{
          type: payloadCapabily.type,
          state: payloadCapabily.state,
        });
      }

      payloadDevice.properties = [];
      const payloadProperties: Property[] = userDevice.properties ? userDevice.properties : [];

      for (const payloadProperty of payloadProperties) {
        const propertyState: PropertyState = <PropertyState>payloadProperty.state;
        const propertyTopicNames: MqttOutputTopicNames = await mqttRepository.getTopicNames(<MqttInputTopicNames>{
          user: req.currentUser,
          deviceId: userDevice.id,
          propertyType: payloadProperty.type,
          propertyStateInstance: propertyState.instance,
        });

        let topicData: CommandTopicData | undefined = undefined;

        const propertyMessage: string | undefined = mqttProvider.getTopicMessage(propertyTopicNames.commandTopic);
        if (propertyMessage !== undefined) {
          if (userDevice?.type) {
            topicData = await mqttRepository.getCommandTopicData(propertyTopicNames.commandTopic, userDevice.type, {
              propertyType: payloadProperty.type,
              propertyStateInstance: propertyState.instance,
            });
          }
          propertyState.value = await mqttRepository.convertMqttMessageToAliceValue(propertyMessage, topicData);
        }

        payloadDevice.properties.push(<Property>{
          type: payloadProperty.type,
          state: payloadProperty.state,
        });
      }
    }

    return res.status(200).json(response);
  });

  /**
   * POST Method.
   * Change device state.
   * https://yandex.ru/dev/dialogs/smart-home/doc/reference/post-action.html?lang=en
   *
   * @param req
   * @param res
   * @returns Response | void
   */
  public devicesAction = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    if (typeof req.body.payload !== 'object' || typeof req.body.payload.devices !== 'object') {
      return next(new AppError(res.__('Page Not Found.'), 404));
    }

    const response: DevicesResponse = {
      request_id: req.requestId,
      payload: {
        devices: JSON.parse(JSON.stringify(req.body.payload.devices)),
      },
    };

    for (const payloadDevice of <Device[]>response.payload.devices) {
      const userDevice: Device | undefined = await deviceRepository.getUserDeviceById(req.currentUser.id, payloadDevice.id);
      if (userDevice === undefined) {
        continue;
      }

      const payloadCapabilities: Capability[] = payloadDevice?.capabilities ? payloadDevice.capabilities : [];

      for (const payloadCapability of payloadCapabilities) {
        const capabilityState: CapabilityState = <CapabilityState>payloadCapability.state;
        const topicNames: MqttOutputTopicNames = await mqttRepository.getTopicNames(<MqttInputTopicNames>{
          user: req.currentUser,
          deviceId: userDevice.id,
          capabilityType: payloadCapability.type,
          capabilityStateInstance: capabilityState.instance,
        });

        let actionResult: CapabilityStateActionResult = {
          status: 'ERROR',
          error_code: 'INVALID_ACTION',
          error_message: res.__('Capability "%s" for the device "%s" can not be changed.', payloadCapability.type, userDevice.id),
        };

        try {
          if (topicNames.commandTopic) {
            let value = capabilityState.value;
            let topicData: CommandTopicData | undefined = undefined;

            const topicMessage: string | undefined = mqttProvider.getTopicMessage(topicNames.commandTopic);
            if (topicMessage !== undefined && userDevice?.type) {
              topicData = await mqttRepository.getCommandTopicData(topicNames.commandTopic, userDevice.type, {
                capabilityType: payloadCapability.type,
                capabilityStateInstance: capabilityState.instance,
              });
              if (topicData !== undefined && topicData.capabilityType === 'devices.capabilities.range') {
                const rangeState: RangeCapabilityState = <RangeCapabilityState>JSON.parse(JSON.stringify(capabilityState));
                if (rangeState.relative) {
                  value += await mqttRepository.convertMqttMessageToAliceValue(topicMessage, topicData);
                }
              }
            }

            await mqttProvider.publish(topicNames.commandTopic, await mqttRepository.convertAliceValueToMqttMessage(value, topicData));

            actionResult = { status: 'DONE' };
          }
        } catch (err) {
          console.log(err, actionResult);
        }

        delete capabilityState.value;
        capabilityState.action_result = actionResult;
      }
    }

    return res.status(200).json(response);
  });
}
