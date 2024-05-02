/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Application, NextFunction, Request, Response } from 'express';
import AppError from '../errors/appError';
import errorHandler from '../errors/handler';
import authRouter from './authRoutes';
import restIndexRouter from './rest/indexRoutes';
import restUserRouter from './rest/userRoutes';

/**
 * Loading Routes.
 */
export default class Routes {
  /**
   * Routes Constructor.
   *
   * @param app
   */
  public constructor(app: Application) {
    // Authentication.
    app.use('/auth', authRouter);

    // REST API.
    app.use('/v1.0', restIndexRouter);
    app.use('/v1.0/user', restUserRouter);

    // Other URLs.
    app.all('*', (req: Request, res: Response, next: NextFunction) => {
      next(new AppError(res.__('Can not find %s on this server!', req.originalUrl), 404));
    });

    app.use(errorHandler);
  }
}
