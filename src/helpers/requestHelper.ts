/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import http, { ClientRequest, IncomingMessage, RequestOptions } from 'http';
import https from 'https';

/**
 * Request Helper.
 */
class RequestHelper {
  /**
   * Make a Request.
   *
   * @param url
   * @param data
   * @param options
   * @returns Promise<RequestOutput>
   */
  public async request(url: string, data: RequestInput = {}, options: RequestOptions = {}): Promise<RequestOutput> {
    return new Promise((resolve, reject): void => {
      options = Object.assign(
        {
          method: 'POST',
          timeout: 3000,
        },
        options,
      );

      options.headers = Object.assign(
        {
          'Content-Type': 'application/json',
        },
        typeof options.headers === 'object' ? options.headers : {},
      );

      const postData: string = JSON.stringify(data);

      if (String(options.method).toLowerCase() === 'post') {
        options.headers['Content-Length'] = postData.length;
      } else if (String(options.method).toLowerCase() === 'get') {
        const urlParams: any[] = [];
        for (const key in data) {
          urlParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`);
        }
        if (urlParams.length > 0) {
          url += '?' + urlParams.join('&');
        }
      }

      const library: typeof https | typeof http = url.startsWith('https:') ? https : http;

      const request: ClientRequest = library.request(url, options, (response: IncomingMessage): void => {
        let result: RequestOutput | undefined = undefined;

        response.on('data', (chunk): void => {
          try {
            result = JSON.parse(chunk.toString());
          } catch (err) {
            console.log('ERROR! Request Data.', err);
            return reject('Error while parsing data!');
          }
        });

        response.on('end', () => {
          if (result !== undefined) {
            return resolve(result);
          }
          return reject('Something went wrong!');
        });
      });

      request.on('error', (error: Error) => {
        console.log('ERROR! Request Error.', error);
        return reject(error);
      });

      if (String(options.method).toLowerCase() === 'post') {
        request.write(postData);
      }
      request.end();
    });
  }

  /**
   * Make a POST Request.
   *
   * @param url
   * @param data
   * @param options
   * @returns Promise<RequestOutput>
   */
  public async post(url: string, data: RequestInput, options: RequestOptions = {}): Promise<RequestOutput> {
    options = Object.assign(options, { method: 'POST' });
    return await this.request(url, data, options);
  }

  /**
   * Make a GET Request.
   *
   * @param url
   * @param data
   * @param options
   * @returns Promise<RequestOutput>
   */
  public async get(url: string, data: RequestInput = {}, options: RequestOptions = {}): Promise<RequestOutput> {
    options = Object.assign(options, { method: 'GET' });
    return await this.request(url, data, options);
  }
}

/**
 * Request Input Type.
 */
export type RequestInput = {
  [key: string]: any;
};

/**
 * Request Output Type.
 */
export type RequestOutput = {
  [key: string]: any;
};

export default new RequestHelper();
