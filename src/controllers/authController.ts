/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import AppError from '../errors/appError';
import { ClientInterface } from '../models/clientModel';
import { UserInterface } from '../models/userModel';
import configProvider from '../providers/configProvider';
import clientRepository from '../repositories/clientRepository';
import userRepository from '../repositories/userRepository';

/**
 * Authorization Controller.
 */
export default class AuthController {
  /**
   * Protect Middleware.
   *
   * @param req
   * @param res
   * @param next
   * @returns void
   */
  public async protect(req: Request, res: Response, next: NextFunction): Promise<void> {
    let token: string = '';
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError(res.__('You are not logged in! Please log in to get access.'), 401));
    }

    try {
      const tokenData: TokenData = await this.verifyToken(token);

      req.currentClient = await clientRepository.getClientById(tokenData.appId);
      req.currentUser = await userRepository.getUserById(tokenData.userId);
    } catch (err) {
      return next(new AppError(res.__('You are not logged in! Please log in to get access.'), 401));
    }

    return next();
  }

  /**
   * GET Method.
   * Get Login Form.
   * https://yandex.ru/dev/dialogs/alice/doc/auth/how-it-works.html?lang=en
   *
   * @param req
   * @param res
   * @param next
   * @returns void
   */
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authParams: AuthParams = this.getAuthParams(req.query);
    if (!this.isAuthRequestValid(authParams)) {
      return next(new AppError(res.__('Invalid input data.'), 400));
    }

    try {
      await clientRepository.getClientByClientId(authParams.client_id);
    } catch (err) {
      return next(new AppError(res.__('This client does not exist.'), 404));
    }

    const viewAuthLogin = configProvider.getConfigOption('viewAuthLogin');

    return res.status(200).render(viewAuthLogin || 'auth/login', {
      title: res.__('Log into your account'),
      params: authParams,
      error: req.query.error || '',
    });
  }

  /**
   * POST Method.
   * Authorization Action.
   * https://yandex.ru/dev/dialogs/alice/doc/auth/how-it-works.html?lang=en#authorization
   *
   * @param req
   * @param res
   * @param next
   * @returns void
   */
  public async loginPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authParams: AuthParams = this.getAuthParams(req.body);
    if (!this.isAuthRequestValid(authParams)) {
      return next(new AppError(res.__('Invalid input data.'), 400));
    }

    const { email, password } = req.body;
    const loginUrl: string = '/auth/login?' + new URLSearchParams(authParams as any).toString();

    if (!email || !password) {
      return res.redirect(loginUrl + '&error=email');
    }

    let client: ClientInterface;
    let user: UserInterface;

    try {
      client = await clientRepository.getClientByClientId(authParams.client_id);
    } catch (err) {
      return next(new AppError(res.__('This client does not exist.'), 404));
    }

    try {
      user = await userRepository.getUserByEmailAndPassword(email, password);
    } catch (err) {
      return res.redirect(loginUrl + '&error=email');
    }

    return res.status(301).redirect(
      authParams.redirect_uri +
        '?' +
        new URLSearchParams({
          code: this.signToken(client.id, user.id, '2 days'),
          state: authParams.state,
          client_id: authParams.client_id,
          scope: authParams.scope,
        }).toString(),
    );
  }

  /**
   * POST Method.
   * Get Token Information.
   * https://yandex.ru/dev/dialogs/alice/doc/auth/how-it-works.html?lang=en
   *
   * This example shows getting an OAuth token in the web service.
   * https://yandex.ru/dev/direct/doc/examples-v5/php5-file_get_contents-token.html?lang=en
   *
   * @param req
   * @param res
   * @param next
   * @returns Response
   */
  public async token(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const code: string = req.body.code as string;
    if (!code) {
      return next(new AppError(res.__('The parameter "%s" is required.', 'code'), 400));
    }

    try {
      const codeData: TokenData = await this.verifyToken(code);
      const client: ClientInterface = await clientRepository.getClientById(codeData.appId);
      const user: UserInterface = await userRepository.getUserById(codeData.userId);

      return res.status(200).json({
        access_token: this.signToken(client.id, user.id, '365 days'),
        token_type: 'bearer',
        expires_in: 60 * 60 * 24 * 365,
      });
    } catch (err) {
      return next(new AppError(res.__('Page Not Found.'), 404));
    }
  }

  /**
   * Get Auth Parameters.
   *
   * @param data
   * @returns AuthParams
   * @protected
   */
  protected getAuthParams(data: any): AuthParams {
    return {
      state: data.state || '',
      redirect_uri: data.redirect_uri || '',
      response_type: data.response_type || '',
      client_id: data.client_id || '',
      scope: data.scope || '',
    };
  }

  /**
   * Is the Authentication Request valid?
   *
   * @param authParams
   * @returns boolean
   * @protected
   */
  protected isAuthRequestValid(authParams: AuthParams): boolean {
    let isValid: boolean = true;
    const requiredFields: string[] = ['state', 'redirect_uri', 'response_type', 'client_id'];

    const authParamKeys = Object.keys(authParams) as (keyof typeof authParams)[];
    authParamKeys.forEach((key: keyof AuthParams): void => {
      const value: any = authParams[key];
      if (requiredFields.includes(key) && !value) {
        isValid = false;
      }
    });

    if (!authParams.redirect_uri.startsWith(process.env.YANDEX_DIALOG_URI as string)) {
      isValid = false;
    }

    return isValid;
  }

  /**
   * Sign Token.
   *
   * @param appId
   * @param userId
   * @param expiresIn
   * @returns string
   * @protected
   */
  protected signToken(appId: number, userId: string | number, expiresIn: string): string {
    const tokenData: TokenData = {
      appId: appId,
      userId: userId,
    };
    return jwt.sign(tokenData, process.env.JWT_SECRET as string, {
      expiresIn: expiresIn,
    });
  }

  /**
   * Verify Token.
   *
   * @param token
   * @returns Promise<TokenData>
   * @protected
   */
  protected async verifyToken(token: string): Promise<TokenData> {
    return new Promise<TokenData>((resolve, reject): void => {
      jwt.verify(token, process.env.JWT_SECRET as string, {}, (err: jwt.VerifyErrors | null, payload: string | jwt.JwtPayload | undefined): void => {
        if (err) {
          return reject(err);
        }
        return resolve(payload as TokenData);
      });
    });
  }
}

/**
 * Auth Params Type.
 * https://yandex.ru/dev/dialogs/alice/doc/auth/how-it-works.html?lang=en#authorization
 */
type AuthParams = {
  /**
   * Authorization state.
   * It is generated by Yandex Dialogs to track the authorization process.
   * The authorization server must return the same value in this parameter to Yandex Dialogs.
   */
  state: string;

  /**
   * The page where the authorized user is redirected (the redirect endpoint).
   */
  redirect_uri: string;

  /**
   * Authorization type. Accepts the "code" value.
   */
  response_type: string;

  /**
   * The ID of your OAuth app.
   */
  client_id: string;

  /**
   * An access scope to be granted to the requested OAuth tokens (the access token scope).
   * For example: "read", "home:lights". To specify multiple accesses, separate them with "&".
   */
  scope: string;
};

/**
 * The Token Data Type.
 */
type TokenData = {
  /**
   * Application ID.
   */
  appId: number;

  /**
   * User ID.
   */
  userId: string | number;
};
