/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { ClientInterface } from '../../src/interfaces/models/clientInterface';
import { UserInterface } from '../../src/interfaces/models/userInterface';

/**
 * Extend Express Properties.
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * The Request ID Property.
       */
      requestId: string;

      /**
       * The Current Client Property.
       */
      currentClient: ClientInterface;

      /**
       * The Current User Property.
       */
      currentUser: UserInterface;
    }
  }
}
