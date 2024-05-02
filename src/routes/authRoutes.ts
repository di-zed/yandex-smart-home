/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Router } from 'express';
import AuthController from '../controllers/authController';
/**
 * Auth Routes.
 */
class AuthRoutes {
  /**
   * Auth Controller.
   *
   * @protected
   */
  protected controller: AuthController = new AuthController();

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
    // API Authorization Endpoint.
    this.router.route('/login').get(this.controller.login).post(this.controller.loginPost);
    // Token Endpoint.
    this.router.route('/token').post(this.controller.token);
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

export default new AuthRoutes().getRouter();
