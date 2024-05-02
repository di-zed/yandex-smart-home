/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { ClientInterface } from '../models/clientModel';
import configProvider from '../providers/configProvider';
import i18n from 'i18n';

/**
 * Client Repository.
 */
class ClientRepository {
  /**
   * Get Client by ID.
   *
   * @param appId
   * @returns Promise<ClientInterface>
   */
  public async getClientById(appId: number): Promise<ClientInterface> {
    const functionGetClientById = configProvider.getConfigOption('functionGetClientById');
    if (typeof functionGetClientById === 'function') {
      return (await functionGetClientById(appId)) as ClientInterface;
    }

    return new Promise<ClientInterface>((resolve, reject): void => {
      if (appId === parseInt(process.env.YANDEX_APP_ID as string, 10)) {
        return resolve({
          id: appId,
          client_id: process.env.YANDEX_APP_CLIENT_ID as string,
          client_secret: process.env.YANDEX_APP_CLIENT_SECRET as string,
        });
      }
      return reject(i18n.__('A client with App ID #%s does not exist.', String(appId)));
    });
  }

  /**
   * Get Client by Client ID.
   *
   * @param clientId
   * @returns Promise<ClientInterface>
   */
  public async getClientByClientId(clientId: string): Promise<ClientInterface> {
    const functionGetClientByClientId = configProvider.getConfigOption('functionGetClientByClientId');
    if (typeof functionGetClientByClientId === 'function') {
      return (await functionGetClientByClientId(clientId)) as ClientInterface;
    }

    return new Promise<ClientInterface>((resolve, reject): void => {
      if (clientId === process.env.YANDEX_APP_CLIENT_ID) {
        return resolve({
          id: parseInt(process.env.YANDEX_APP_ID as string, 10),
          client_id: clientId,
          client_secret: process.env.YANDEX_APP_CLIENT_SECRET as string,
        });
      }
      return reject(i18n.__('A client with Client ID "%s" does not exist.', clientId));
    });
  }
}

export default new ClientRepository();
