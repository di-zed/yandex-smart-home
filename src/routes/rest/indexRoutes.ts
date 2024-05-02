/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Router } from 'express';
import RestIndexController from '../../controllers/rest/indexController';
/**
 * REST Index Routes.
 */
class IndexRoutes {
  /**
   * REST Index Controller.
   *
   * @protected
   */
  protected controller: RestIndexController = new RestIndexController();

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
    // Checking the provider's Endpoint URL availability.
    this.router.route('/').head(this.controller.index);
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

export default new IndexRoutes().getRouter();
