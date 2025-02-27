/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import express, { Application } from 'express';
import fs from 'fs';
import https from 'https';
import yandexSmartHome from './index';

process.on('unhandledRejection', (err: any) => {
  console.log('ERROR! Unhandled Rejection! Shutting Down!');
  console.log(err);
  process.exit(1);
});

process.on('uncaughtException', (err: any) => {
  console.log('ERROR! Uncaught Exception! Shutting Down!');
  console.log(err);
  process.exit(1);
});

const app: Application = express();
yandexSmartHome(app, {});

try {
  let server;

  const tlsKey: string = (process.env.SERVER_TLS_KEY as string).trim();
  const tlsCert: string = (process.env.SERVER_TLS_CERT as string).trim();

  if (tlsKey && tlsCert) {
    const tlsPort: number = process.env.SERVER_TLS_CONTAINER_PORT ? parseInt(process.env.SERVER_TLS_CONTAINER_PORT, 10) : 443;

    server = https
      .createServer(
        {
          key: fs.readFileSync(tlsKey),
          cert: fs.readFileSync(tlsCert),
        },
        app,
      )
      .listen(tlsPort, (): void => {
        console.log(`The server is running on port ${tlsPort}.`);
      });
  } else {
    const port: number = process.env.SERVER_CONTAINER_PORT ? parseInt(process.env.SERVER_CONTAINER_PORT, 10) : 3000;

    server = app.listen(port, (): void => {
      console.log(`The server is running on port ${port}.`);
    });
  }

  server.on('error', (err: any): void => {
    if (err.code === 'EADDRINUSE') {
      console.log('ERROR! The server can NOT start. The address is already in use.');
    } else {
      console.log('ERROR! The server can NOT start.', err);
    }
  });
} catch (err) {
  console.log('ERROR! The server can NOT start.', err);
}
