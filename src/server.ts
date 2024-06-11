/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import express, { Application } from 'express';
import fs from 'fs';
import https from 'https';
import yandexSmartHome from './index';

process.on('unhandledRejection', (err: any) => {
  console.log('Unhandled Rejection! Shutting Down!');
  console.log(err);
  process.exit(1);
});

process.on('uncaughtException', (err: any) => {
  console.log('Uncaught Exception! Shutting Down!');
  console.log(err);
  process.exit(1);
});

const app: Application = express();
yandexSmartHome(app, {});

try {
  let server;

  const sslKey: string = process.env.SERVER_SSL_KEY as string;
  const sslCert: string = process.env.SERVER_SSL_CERT as string;

  if (sslKey && sslCert) {
    const sslPort: number = process.env.SERVER_SSL_PORT ? parseInt(process.env.SERVER_SSL_PORT, 10) : 443;

    server = https
      .createServer(
        {
          key: fs.readFileSync(sslKey),
          cert: fs.readFileSync(sslCert),
        },
        app,
      )
      .listen(sslPort, () => {
        console.log(`The server is running on port ${sslPort}.`);
      });
  } else {
    const port: number = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : 3000;

    server = app.listen(port, () => {
      console.log(`The server is running on port ${port}.`);
    });
  }

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log('ERROR! The server can NOT start. The address is already in use.');
    } else {
      console.log(err);
    }
  });
} catch (err) {
  console.log(err);
}
