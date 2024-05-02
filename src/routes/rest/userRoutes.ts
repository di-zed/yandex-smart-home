/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Router } from 'express';
import AuthController from '../../controllers/authController';
import RestUserController from '../../controllers/rest/userController';
/**
 * REST User Routes.
 */
class UserRoutes {
  /**
   * REST User Controller.
   *
   * @protected
   */
  protected controller: RestUserController = new RestUserController();

  /**
   * Router.
   *
   * @protected
   */
  protected router: Router = Router();

  /**
   * Routes Constructor.
   */
  public constructor() {
    this.initRoutes();
  }

  /**
   * Routes Initialization.
   *
   * @returns void
   * @protected
   */
  protected initRoutes(): void {
    const authController = new AuthController();

    // Notification of unlinked accounts.
    this.router.route('/unlink').post(authController.protect, this.controller.unlink);
    // Information about user devices.
    this.router.route('/devices').get(authController.protect, this.controller.devices);
    // Information about the states of user devices.
    this.router.route('/devices/query').post(authController.protect, this.controller.devicesQuery);
    // Change device state.
    this.router.route('/devices/action').post(authController.protect, this.controller.devicesAction);
  }

  /**
   * Get Router.
   *
   * @returns Router
   */
  public getRouter(): Router {
    return this.router;
  }
}

export default new UserRoutes().getRouter();
