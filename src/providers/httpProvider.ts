/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import http, { ClientRequest, IncomingMessage, RequestOptions } from 'http';
import https from 'https';

/**
 * Request Helper.
 */
class HttpProvider {
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

      const body: string = JSON.stringify(data);

      if (['post', 'put', 'delete'].includes(String(options.method).toLowerCase())) {
        options.headers['Content-Length'] = body.length;
      } else if (String(options.method).toLowerCase() === 'get') {
        const urlParams: any[] = [];
        for (const key in data) {
          urlParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(data[key]))}`);
        }
        if (urlParams.length > 0) {
          url += '?' + urlParams.join('&');
        }
      }

      const library: typeof https | typeof http = url.startsWith('https:') ? https : http;

      const request: ClientRequest = library.request(url, options, (response: IncomingMessage): void => {
        let result: RequestOutput | undefined = undefined;

        let data: string = '';
        response.on('data', (chunk): void => {
          data += String(chunk);
        });

        response.on('end', () => {
          try {
            result = JSON.parse(data) || undefined;
            if (result !== undefined) {
              return resolve(result);
            }
          } catch (err) {
            return reject('Error while parsing data!');
          }

          return reject('Something went wrong!');
        });
      });

      request.on('error', (error: Error) => {
        return reject(error);
      });

      if (['post', 'put', 'delete'].includes(String(options.method).toLowerCase())) {
        request.write(body);
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
   * Make a PUT Request.
   *
   * @param url
   * @param data
   * @param options
   * @returns Promise<RequestOutput>
   */
  public async put(url: string, data: RequestInput, options: RequestOptions = {}): Promise<RequestOutput> {
    options = Object.assign(options, { method: 'PUT' });
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

  /**
   * Make a DELETE Request.
   *
   * @param url
   * @param data
   * @param options
   * @returns Promise<RequestOutput>
   */
  public async delete(url: string, data: RequestInput, options: RequestOptions = {}): Promise<RequestOutput> {
    options = Object.assign(options, { method: 'DELETE' });
    return await this.request(url, data, options);
  }
}

/**
 * Request Input Type.
 */
export type RequestInput = Record<string, unknown>;

/**
 * Request Output Type.
 */
export type RequestOutput = Record<string, unknown>;

export default new HttpProvider();
