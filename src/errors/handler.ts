/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { NextFunction, Request, Response } from 'express';
import i18n from 'i18n';
import AppError from '../errors/appError';

/**
 * Error Handler.
 */
class ErrorHandler {
  /**
   * Status Code.
   *
   * @protected
   */
  protected statusCode: number = 500;

  /**
   * Status.
   *
   * @protected
   */
  protected status: string = 'error';

  /**
   * Is Operational Error?
   *
   * @protected
   */
  protected isOperational: boolean = false;

  /**
   * Error Handler Constructor.
   *
   * @param err
   * @param req
   * @param res
   * @param next
   */
  public constructor(err: Error, req: Request, res: Response, next: NextFunction) {
    if (process.env.NODE_ENV === 'development') {
      this.updateProperties(err);
      this.generateErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
      let handledError = null;
      if (err.name === 'JsonWebTokenError') {
        handledError = this.handleJsonWebTokenError();
      } else if (err.name === 'TokenExpiredError') {
        handledError = this.handleTokenExpiredError();
      }
      this.updateProperties(handledError || err);
      this.generateErrorProd(handledError || err, req, res);
    }
  }

  /**
   * Generate an Error for the Development Mode.
   *
   * @param err
   * @param req
   * @param res
   * @returns Response | void
   * @protected
   */
  protected generateErrorDev(err: Error, req: Request, res: Response): Response | void {
    // REST API.
    if (req.originalUrl.startsWith('/v1.0')) {
      return res.status(this.statusCode).json({
        status: this.status,
        message: err.message,
        error: err,
        stack: err.stack,
      });
    }

    // Website.
    return res.status(this.statusCode).render('error', {
      title: res.__('Something went wrong!'),
      errorMessage: err.message,
    });
  }

  /**
   * Generate an Error for the Production Mode.
   *
   * @param err
   * @param req
   * @param res
   * @returns Response | void
   * @protected
   */
  protected generateErrorProd(err: Error, req: Request, res: Response): Response | void {
    // REST API.
    if (req.originalUrl.startsWith('/v1.0')) {
      if (this.isOperational) {
        return res.status(this.statusCode).json({
          status: this.status,
          message: err.message,
        });
      }
      console.error('ERROR!', err);
      return res.status(500).json({
        status: 'error',
        message: res.__('Something went wrong!'),
      });
    }

    // Website.
    if (this.isOperational) {
      return res.status(this.statusCode).render('error', {
        title: res.__('Something went wrong!'),
        errorMessage: err.message,
      });
    }
    console.error('ERROR!', err);
    return res.status(this.statusCode).render('error', {
      title: res.__('Something went wrong!'),
      errorMessage: res.__('Please try again later.'),
    });
  }

  /**
   * Handle JSON Web Token Error.
   *
   * @returns AppError
   * @protected
   */
  protected handleJsonWebTokenError(): AppError {
    return new AppError(i18n.__('Invalid token. Please log in again!'), 401);
  }

  /**
   * Handle Token Expired Error.
   *
   * @returns AppError
   * @protected
   */
  protected handleTokenExpiredError(): AppError {
    return new AppError(i18n.__('Your token has expired! Please log in again.'), 401);
  }

  /**
   * Update Error Handler Properties.
   *
   * @param err
   * @returns ErrorHandler
   * @private
   */
  private updateProperties(err: Error): ErrorHandler {
    this.statusCode = 500;
    this.status = 'error';
    this.isOperational = false;

    if (err instanceof AppError) {
      this.statusCode = err.statusCode;
      this.status = err.status;
      this.isOperational = err.isOperational;
    }

    return this;
  }
}

export default function (err: Error, req: Request, res: Response, next: NextFunction): ErrorHandler {
  return new ErrorHandler(err, req, res, next);
}
