/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import i18n from 'i18n';
import fs from 'fs';
import { UserInterface } from '../models/userModel';
import configProvider from '../providers/configProvider';

/**
 * User Repository.
 */
class UserRepository {
  /**
   * Cached Config Users.
   *
   * @protected
   */
  protected configUsers: UserInterface[] | undefined;

  /**
   * Get User by ID.
   *
   * @param userId
   * @returns Promise<UserInterface>
   */
  public async getUserById(userId: string | number): Promise<UserInterface> {
    const functionGetUserById = configProvider.getConfigOption('functionGetUserById');
    if (typeof functionGetUserById === 'function') {
      return (await functionGetUserById(userId)) as UserInterface;
    }

    const configUsers: UserInterface[] = await this.getConfigUsers();

    return new Promise<UserInterface>((resolve, reject): void => {
      const user: UserInterface | undefined = configUsers.find((element: UserInterface): boolean => String(element.id) === String(userId));
      if (user) {
        const result: UserInterface = JSON.parse(JSON.stringify(user));
        delete result.password;
        return resolve(result);
      }
      return reject(i18n.__('A user with ID #%s does not exist.', String(userId)));
    });
  }

  /**
   * Get User by Email and Password.
   *
   * @param email
   * @param password
   * @returns Promise<UserInterface>
   */
  public async getUserByEmailAndPassword(email: string, password: string): Promise<UserInterface> {
    const functionGetUserByEmailAndPassword = configProvider.getConfigOption('functionGetUserByEmailAndPassword');
    if (typeof functionGetUserByEmailAndPassword === 'function') {
      return (await functionGetUserByEmailAndPassword(email, password)) as UserInterface;
    }

    const configUsers: UserInterface[] = await this.getConfigUsers();

    return new Promise<UserInterface>((resolve, reject): void => {
      const user: UserInterface | undefined = configUsers.find((element: UserInterface): boolean => {
        return element.email === email && element.password === password;
      });
      if (user) {
        const result: UserInterface = JSON.parse(JSON.stringify(user));
        delete result.password;
        return resolve(result);
      }
      return reject(i18n.__('A user with email "%s" does not exist.', email));
    });
  }

  /**
   * Get User by Name or Email.
   *
   * @param nameOrEmail
   * @returns Promise<UserInterface>
   */
  public async getUserByNameOrEmail(nameOrEmail: string): Promise<UserInterface> {
    const functionGetUserByNameOrEmail = configProvider.getConfigOption('functionGetUserByNameOrEmail');
    if (typeof functionGetUserByNameOrEmail === 'function') {
      return (await functionGetUserByNameOrEmail(nameOrEmail)) as UserInterface;
    }

    const configUsers: UserInterface[] = await this.getConfigUsers();

    return new Promise<UserInterface>((resolve, reject): void => {
      const user: UserInterface | undefined = configUsers.find((element: UserInterface): boolean => {
        if (nameOrEmail.search('@') !== -1) {
          return element.email === nameOrEmail;
        }
        return element.fullName === nameOrEmail;
      });
      if (user) {
        const result: UserInterface = JSON.parse(JSON.stringify(user));
        delete result.password;
        return resolve(result);
      }
      return reject(i18n.__('A user with name/email "%s" does not exist.', nameOrEmail));
    });
  }

  /**
   * Get Users from the Configuration file.
   *
   * @returns Promise<UserInterface[]>
   */
  public async getConfigUsers(): Promise<UserInterface[]> {
    try {
      if (this.configUsers === undefined) {
        const configFileUsers = configProvider.getConfigOption('configFileUsers');
        const filePath = configFileUsers ? configFileUsers : `${__dirname}/../../config/users.json`;
        this.configUsers = await JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }));
      }
      return <UserInterface[]>this.configUsers;
    } catch (err) {
      return [];
    }
  }
}

export default new UserRepository();
