/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Request, Response } from 'express';

/**
 * REST Index Controller.
 */
export default class IndexController {
  /**
   * HEAD Method.
   * Checking the provider's Endpoint URL availability.
   * https://yandex.ru/dev/dialogs/smart-home/doc/reference/check.html?lang=en
   *
   * @param req
   * @param res
   * @returns Response
   */
  public index(req: Request, res: Response): Response {
    return res.status(200).json();
  }
}
