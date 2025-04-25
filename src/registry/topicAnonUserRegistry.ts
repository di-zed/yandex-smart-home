/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import Registry from './registry';

/**
 * Topic Anonymous User Registry.
 */
class TopicAnonUserRegistry extends Registry {
  /**
   * @inheritDoc
   */
  protected data: UserRequestedAt = {};

  /**
   * Mark User as Anonymous.
   *
   * @param userName
   * @returns boolean
   */
  public markUserAsAnonymous(userName: string): boolean {
    return this.set(userName, new Date());
  }

  /**
   * Check if the user is anonymous.
   *
   * @param userName
   * @returns boolean
   */
  public isUserAnonymous(userName: string): boolean {
    const requestedAt: Date | undefined = this.get(userName);

    if (requestedAt !== undefined) {
      const now: Date = new Date();
      now.setSeconds(now.getSeconds() - 300); // 5 minutes

      if (new Date(requestedAt) < now) {
        this.delete(userName);
        return false;
      }

      return true;
    }

    return false;
  }
}

/**
 * Data "Username => Requested At" Type.
 */
export type UserRequestedAt = {
  [key: string]: Date;
};

export default new TopicAnonUserRegistry();
