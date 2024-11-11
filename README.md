[English Version](#version_en) | [Русская Версия](#version_ru)

###### Node.js (Express, TypeScript)

<a name="version_en"><h1>Yandex Smart Home</h1></a>

This module is specially designed to work with the [Yandex.Dialogs](https://dialogs.yandex.ru/) service.

It is a bridge between the smart home service from Yandex and the MQTT server. The module can be used as [main](#installed_main_en), and can also be installed as [auxiliary](#installed_node_en) in another project.

To work, you need to [create and configure a skill](https://yandex.ru/dev/dialogs/alice/doc/skill-create-console.html?lang=en) in the developer console, and then [link accounts](https://yandex.ru/dev/dialogs/smart-home/doc/auth/add-skill-to-console.html?lang=en), indicating [correct links](#implemented_auth_en) implemented in this module.

The essence of the module is that upon command, for example, "Alice, turn on the light", the required value is sent to the required MQTT topic, which can then be processed depending on the needs and capabilities. For example, you can have your own devices that work with MQTT, or you can run the script in a program like Node-RED, etc.

### Implemented.

- [Authorization in the skill](#implemented_auth_en).
- [Protocol for the operation of the smart home platform](#implemented_rest_api_en).
- [Devices configuration](#implemented_devices_en).
- [Users configuration](#implemented_users_en).
- [Configuration of MQTT topics](#implemented_mqtt_en).

<a name="installed_main_en"><h3>Installing and launching the module as the main one.</h3></a>

1. Clone the project.
    ```
    git clone git@github.com:di-zed/yandex-smart-home.git
    ```
2. **SSL certificate.** For this module, Yandex requires an SSL certificate. Generate it (self-signed certificates will not work) and put it in the *./volumes/etc/ssl* folder.
3. Copy the *./.env.sample* file to the *./.env* file. Check it and edit some parameters if necessary.
4. **Mosquitto.** Copy the *./volumes/etc/mosquitto/passwd.sample* file to the *./volumes/etc/mosquitto/passwd* file to configure Mosquitto users.
5. **Mosquitto.** The default user in the *passwd* file is **root**, password is **123456**.
6. **Mosquitto.** Copy the *./volumes/mosquitto/config/mosquitto.conf.sample* file to the *./volumes/mosquitto/config/mosquitto.conf* file to configure Mosquitto.
7. **Mosquitto.** If you need to set up a secure connection, you can find examples of generating self-signed certificates at these links:

   https://manpages.ubuntu.com/manpages/bionic/man7/mosquitto-tls.7.html

   https://gist.github.com/suru-dissanaike/4344f572b14c108fc3312fc4fcc3d138
8. **Optional.** If you want to add a new user to Mosquitto:
     ```code
     docker-compose exec eclipse-mosquitto mosquitto_passwd -c /etc/mosquitto/passwd new_user_name
     ```
9. **Optional.** If you get an error like *Warning: File /etc/mosquitto/passwd has world readable permissions. Future versions will refuse to load this file*. Please do:
     ```code
     chmod 0700 volumes/etc/mosquitto/passwd
     ```
10. **Redis.** Copy the *./volumes/usr/local/etc/redis/redis.conf.sample* file to the *./volumes/usr/local/etc/redis/redis.conf* file to configure Redis.
11. **Redis.** Default user password - **123456**. If you need to change, you need to do it in two files at the same time: *.env*, *redis.conf*.
12. Configure [devices](#implemented_devices_en), [users](#implemented_users_en) and [MQTT topics](#implemented_mqtt_en).
13. **Launch.** The project is wrapped in Docker. To start, you need to do:
     ```code
     docker-compose stop && docker-compose up -d
     ```
   If the **.env** file contains the **SERVER_TLS_KEY** and **SERVER_TLS_CERT** parameters, then the module will try to use the **SERVER_TLS_CONTAINER_PORT** port, otherwise - **SERVER_CONTAINER_PORT** (may be needed for testing and development).

<a name="installed_node_en"><h3>Installing and configuring the module as an auxiliary one.</h3></a>

1. Installing the module in the project.
    ```
    npm install @di-zed/yandex-smart-home
    ```
2. From the **./node_modules/@di-zed/yandex-smart-home** folder, copy the following folders and files into the project:
   - config
   - .env.sample
3. If you plan to use Docker, you can also copy:
   - [volumes](https://github.com/di-zed/yandex-smart-home/tree/main/volumes)
   - [docker-compose.yml](https://github.com/di-zed/yandex-smart-home/blob/main/docker-compose.yml)
4. Review all the points (starting from 2) from the section *[Installing and launching the module as the main one](#installed_main_en)*. Apply as required.
5. Before initializing the server, import and pass all the necessary parameters to the module.
    ```typescript
    import express, { Application } from 'express';
    import yandexSmartHome from '@di-zed/yandex-smart-home';
   
    const app: Application = express();
   
    yandexSmartHome(app, {
       // ...
       configFileDevices: './config/devices.json',
       configFileUsers: './config/users.json',
       configFileMqtt: './config/mqtt.json',
       // ...
     });
    ```
   The full list of parameters can be found in the file *[src/interfaces/configInterface.ts](https://github.com/di-zed/yandex-smart-home/blob/main/src/interfaces/configInterface.ts)* .
6. To automatically notify Yandex about changes in device parameters, be sure to use the "callbackRestUserDevicesAction" parameter from "configInterface".
   ```typescript
   import express, { Application } from 'express';
   import yandexSmartHome from '@di-zed/yandex-smart-home';
   import yandexSkillRepository from '@di-zed/yandex-smart-home/dist/repositories/skillRepository';
   
   const app: Application = express();
   
   yandexSmartHome(app, {
      // ...
      callbackRestUserDevicesAction: yandexSkillRepository.execTempUserStateCallback.bind(yandexSkillRepository),
      // ...
    });
   ```
   
<a name="implemented_auth_en"><h3>Authorization in the skill.</h3></a>

- How authorization works: [/auth/login, /auth/token](https://yandex.ru/dev/dialogs/alice/doc/auth/how-it-works.html?lang=en).

<a name="implemented_rest_api_en"><h3>Protocol for the operation of the smart home platform.</h3></a>

- Checking the provider's Endpoint URL availability: [/v1.0](https://yandex.ru/dev/dialogs/smart-home/doc/reference/check.html?lang=en).
- Notification of unlinked accounts: [/v1.0/user/unlink](https://yandex.ru/dev/dialogs/smart-home/doc/reference/unlink.html?lang=en).
- Information about user devices: [/v1.0/user/devices](https://yandex.ru/dev/dialogs/smart-home/doc/reference/get-devices.html?lang=en).
- Information about the states of user devices: [/v1.0/user/devices/query](https://yandex.ru/dev/dialogs/smart-home/doc/reference/post-devices-query.html?lang=en).
- Change device state: [/v1.0/user/devices/action](https://yandex.ru/dev/dialogs/smart-home/doc/reference/post-action.html?lang=en).

<a name="implemented_devices_en"><h3>Devices configuration.</h3></a>

In the root of the module, in the **config** folder, you need to copy the file **[devices.sample.json](https://github.com/di-zed/yandex-smart-home/blob/main/config/devices.sample.json)** into the same folder named **devices.json**.

Next, describe the available devices by analogy.

On the Yandex Dialogs website you can familiarize yourself with [device types](https://yandex.ru/dev/dialogs/smart-home/doc/concepts/device-types.html?lang=en), [skills](https://yandex.ru/dev/dialogs/smart-home/doc/concepts/capability-types.html?lang=en) and [properties](https://yandex.ru/dev/dialogs/smart-home/doc/concepts/properties-types.html?lang=en).

Information about the user's devices will be taken from this file.

As an alternative, [special hooks](https://github.com/di-zed/yandex-smart-home/blob/main/src/interfaces/configInterface.ts) can be used if the module has been installed in the project, and not used as the main one.

<a name="implemented_users_en"><h3>Users configuration.</h3></a>

In the root of the module, in the **config** folder, you need to copy the file **[users.sample.json](https://github.com/di-zed/yandex-smart-home/blob/main/config/users.sample.json)** into the same folder named **users.json**.

Next, by analogy, describe the existing users.

Authorization in the skill will target users from this file.

As an alternative, [special hooks](https://github.com/di-zed/yandex-smart-home/blob/main/src/interfaces/configInterface.ts) can be used if the module has been installed in the project, and not used as the main one.

<a name="implemented_mqtt_en"><h3>Configuration of MQTT topics.</h3></a>

In the root of the module, in the **config** folder, you need to copy the file **[mqtt.sample.json](https://github.com/di-zed/yandex-smart-home/blob/main/config/mqtt.sample.json)** into the same folder named **mqtt.json**.

Next, by analogy, describe the existing topics.

The module will listen to topics described in this file.

As an alternative, [special hooks](https://github.com/di-zed/yandex-smart-home/blob/main/src/interfaces/configInterface.ts) can be used if the module has been installed in the project, and not used as the main one.

<a name="version_ru"><h1>Яндекс Умный Дом</h1></a>

Данный модуль специально разработан для работы с сервисом [Яндекс.Диалоги](https://dialogs.yandex.ru/).

Он является мостом между сервисом умного дома от Яндекса и MQTT-сервером. Модуль может быть использован как [основной](#installed_main_ru), а также может быть установлен в качестве [вспомогательного](#installed_node_ru) в другом проекте.

Для работы необходимо [создать и настроить навык](https://yandex.ru/dev/dialogs/alice/doc/skill-create-console.html?lang=ru) в консоли разработчика, а затем [связать аккаунты](https://yandex.ru/dev/dialogs/smart-home/doc/auth/add-skill-to-console.html?lang=ru), указав [корректные ссылки](#implemented_auth_ru), реализованные в данном модуле.

Суть модуля заключается в том, чтобы по команде, например, "Алиса, включи свет", в требуемый топик MQTT отправлялось нужное значение, которое затем может быть обработано в зависимости от потребностей и возможностей. Например, вы можете иметь свои собственные устройства, которые работают с MQTT, или же можно обработать сценарий в программе типа Node-RED и т.д.

### Реализовано.

- [Авторизация в навыке](#implemented_auth_ru).
- [Протокол работы платформы умного дома](#implemented_rest_api_ru).
- [Конфигурация устройств](#implemented_devices_ru).
- [Конфигурация пользователей](#implemented_users_ru).
- [Конфигурация MQTT-топиков](#implemented_mqtt_ru).

<a name="installed_main_ru"><h3>Установка и запуск модуля, как основного.</h3></a>

1. Клонируйте проект.
   ```
   git clone git@github.com:di-zed/yandex-smart-home.git
   ```
2. **SSL-сертификат.** Для данного модуля Яндекс требует наличие SSL-сертификата. Сгенерируйте его (самоподписанные сертификаты работать не будут) и положите в папку *./volumes/etc/ssl*.
3. Скопируйте файл *./.env.sample* в файл *./.env*. Проверьте его и при необходимости отредактируйте некоторые параметры.
4. **Mosquitto.** Скопируйте файл *./volumes/etc/mosquitto/passwd.sample* в файл *./volumes/etc/mosquitto/passwd* для настройки пользователей Mosquitto.
5. **Mosquitto.** Пользователь по умолчанию в файле *passwd* — **root**, пароль — **123456**.
6. **Mosquitto.** Скопируйте файл *./volumes/mosquitto/config/mosquitto.conf.sample* в файл *./volumes/mosquitto/config/mosquitto.conf* для конфигурации Mosquitto.
7. **Mosquitto.** При необходимости настроить защищенное соединение, можно найти примеры генерации самоподписных сертификатов по этим ссылкам:

   https://manpages.ubuntu.com/manpages/bionic/man7/mosquitto-tls.7.html

   https://gist.github.com/suru-dissanaike/4344f572b14c108fc3312fc4fcc3d138
8. **Необязательно.** Если вы хотите добавить нового пользователя в Mosquitto:
    ```code
    docker-compose exec eclipse-mosquitto mosquitto_passwd -c /etc/mosquitto/passwd new_user_name
    ```
9. **Необязательно.** Если у вас возникла ошибка, типа *Warning: File /etc/mosquitto/passwd has world readable permissions. Future versions will refuse to load this file*. Пожалуйста, выполните:
    ```code
    chmod 0700 volumes/etc/mosquitto/passwd
    ```
10. **Redis.** Скопируйте файл *./volumes/usr/local/etc/redis/redis.conf.sample* в файл *./volumes/usr/local/etc/redis/redis.conf* для конфигурации Redis.
11. **Redis.** Пароль пользователя по умолчанию - **123456**. Изменять нужно в двух файлах одновременно: *.env*, *redis.conf*.
12. Сконфигурируйте [устройства](#implemented_devices_ru), [пользователей](#implemented_users_ru) и [MQTT-топики](#implemented_mqtt_ru).
13. **Запуск.** Проект обернут в Docker. Для запуска, необходимо выполнить:
    ```code
    docker-compose stop && docker-compose up -d
    ```
   Если в файле **.env** указаны параметры **SERVER_TLS_KEY** и **SERVER_TLS_CERT**, то модуль будет пытаться использовать порт **SERVER_TLS_CONTAINER_PORT**, в противном случае - **SERVER_CONTAINER_PORT** (может понадобиться для тестирования и разработки).

<a name="installed_node_ru"><h3>Установка и настройка модуля, как вспомогательного.</h3></a>

1. Установка модуля в проект.
   ```
   npm install @di-zed/yandex-smart-home
   ```
2. Из папки **./node_modules/@di-zed/yandex-smart-home** скопировать в проект следующие папки и файлы:
   - config
   - .env.sample
3. Если планируете использовать Docker, так же можно скопировать:
   - [volumes](https://github.com/di-zed/yandex-smart-home/tree/main/volumes)
   - [docker-compose.yml](https://github.com/di-zed/yandex-smart-home/blob/main/docker-compose.yml)
4. Просмотрите все пункты (начиная с 2), из секции *[Установка и запуск модуля, как основного](#installed_main_ru)*. Примените, которые требуются.
5. До инициализации сервера, подключите и передайте все необходимые параметры в модуль.
   ```typescript
   import express, { Application } from 'express';
   import yandexSmartHome from '@di-zed/yandex-smart-home';
   
   const app: Application = express();
   
   yandexSmartHome(app, {
      // ...
      configFileDevices: './config/devices.json',
      configFileUsers: './config/users.json',
      configFileMqtt: './config/mqtt.json',
      // ...
    });
   ```
   С полным списком параметров можно ознакомиться в файле *[src/interfaces/configInterface.ts](https://github.com/di-zed/yandex-smart-home/blob/main/src/interfaces/configInterface.ts)*.
6. Для автоматического уведомления Яндекса об изменении параметров устройств, обязательно используйте "callbackRestUserDevicesAction" параметр из "configInterface".
   ```typescript
   import express, { Application } from 'express';
   import yandexSmartHome from '@di-zed/yandex-smart-home';
   import yandexSkillRepository from '@di-zed/yandex-smart-home/dist/repositories/skillRepository';
   
   const app: Application = express();
   
   yandexSmartHome(app, {
      // ...
      callbackRestUserDevicesAction: yandexSkillRepository.execTempUserStateCallback.bind(yandexSkillRepository),
      // ...
    });
   ```

<a name="implemented_auth_ru"><h3>Авторизация в навыке.</h3></a>

- Как устроена авторизация: [/auth/login, /auth/token](https://yandex.ru/dev/dialogs/alice/doc/auth/how-it-works.html?lang=ru).

<a name="implemented_rest_api_ru"><h3>Протокол работы платформы умного дома.</h3></a>

- Проверка доступности Endpoint URL провайдера: [/v1.0](https://yandex.ru/dev/dialogs/smart-home/doc/reference/check.html?lang=ru).
- Оповещение о разъединении аккаунтов: [/v1.0/user/unlink](https://yandex.ru/dev/dialogs/smart-home/doc/reference/unlink.html?lang=ru).
- Информация об устройствах пользователя: [/v1.0/user/devices](https://yandex.ru/dev/dialogs/smart-home/doc/reference/get-devices.html?lang=ru).
- Информация о состояниях устройств пользователя: [/v1.0/user/devices/query](https://yandex.ru/dev/dialogs/smart-home/doc/reference/post-devices-query.html?lang=ru).
- Изменение состояния у устройств: [/v1.0/user/devices/action](https://yandex.ru/dev/dialogs/smart-home/doc/reference/post-action.html?lang=ru).

<a name="implemented_devices_ru"><h3>Конфигурация устройств.</h3></a>

В корне модуля, в папке **config**, необходимо скопировать файл **[devices.sample.json](https://github.com/di-zed/yandex-smart-home/blob/main/config/devices.sample.json)** в ту же самую папку с именем **devices.json**.

Далее, по аналогии описать имеющиеся устройства.

На сайте Яндекс Диалогов можно ознакомиться с [типами устройств](https://yandex.ru/dev/dialogs/smart-home/doc/concepts/device-types.html?lang=ru), [умениями](https://yandex.ru/dev/dialogs/smart-home/doc/concepts/capability-types.html?lang=ru) и [свойствами](https://yandex.ru/dev/dialogs/smart-home/doc/concepts/properties-types.html?lang=ru).

Информация об устройствах пользователя будет браться из этого файла.

Как альтернатива, могут быть использованы [специальные хуки](https://github.com/di-zed/yandex-smart-home/blob/main/src/interfaces/configInterface.ts), если модуль был установлен в проект, а не используется как основной.

<a name="implemented_users_ru"><h3>Конфигурация пользователей.</h3></a>

В корне модуля, в папке **config**, необходимо скопировать файл **[users.sample.json](https://github.com/di-zed/yandex-smart-home/blob/main/config/users.sample.json)** в ту же самую папку с именем **users.json**.

Далее, по аналогии описать имеющихся пользователей.

Авторизация в навыке будет ориентироваться на пользователей из этого файла.

Как альтернатива, могут быть использованы [специальные хуки](https://github.com/di-zed/yandex-smart-home/blob/main/src/interfaces/configInterface.ts), если модуль был установлен в проект, а не используется как основной.

<a name="implemented_mqtt_ru"><h3>Конфигурация MQTT-топиков.</h3></a>

В корне модуля, в папке **config**, необходимо скопировать файл **[mqtt.sample.json](https://github.com/di-zed/yandex-smart-home/blob/main/config/mqtt.sample.json)** в ту же самую папку с именем **mqtt.json**.

Далее, по аналогии описать имеющиеся топики.

Модуль будет слушать топики, описанные в этом файле.

Как альтернатива, могут быть использованы [специальные хуки](https://github.com/di-zed/yandex-smart-home/blob/main/src/interfaces/configInterface.ts), если модуль был установлен в проект, а не используется как основной.

## [Docker](https://docs.docker.com/compose/install/)

### Node (18.18.0)

- Host: node18
- Ports: 3000, 443
- URL: http://localhost:3000/

```code
docker-compose exec node18 /bin/bash
```

### Eclipse Mosquitto (2.0.18)

- Host: eclipse-mosquitto
- Ports: 1883, 9001

### Redis (7.4-rc1-alpine3.20)

- Host: redis
- Port: 6379

```code
docker-compose exec redis redis-cli -h redis -p 6379
```
