/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Router } from 'express';
import catchAsync from '../../errors/catchAsync';
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
    const authController: AuthController = new AuthController();

    // Notification of unlinked accounts.
    this.router
      .route('/unlink')
      .post(catchAsync(authController.protect.bind(authController)), catchAsync(this.controller.unlink.bind(this.controller)));

    // Information about user devices.
    this.router
      .route('/devices')
      .get(catchAsync(authController.protect.bind(authController)), catchAsync(this.controller.devices.bind(this.controller)));

    // Information about the states of user devices.
    this.router
      .route('/devices/query')
      .post(catchAsync(authController.protect.bind(authController)), catchAsync(this.controller.devicesQuery.bind(this.controller)));

    // Change device state.
    this.router
      .route('/devices/action')
      .post(catchAsync(authController.protect.bind(authController)), catchAsync(this.controller.devicesAction.bind(this.controller)));
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
