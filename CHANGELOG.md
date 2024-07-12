# CHANGE LOG

## [1.2.0] - 2024-07-12

### Added

- Two new callback methods: "callbackRedisIsReady", "callbackMqttIsSubscribed".

### Changed

- Renamed callback "functionRestUserUnlinkAction" to "callbackRestUserUnlinkAction".
- Renamed callback "functionListenTopic" to "callbackListenTopic".
- Adjusted Redis Provider. Also removed "getValue" and "setValue" methods.
- Adjusted MQTT Provider.

### Fixed

- The MQTT Message Callback method is no longer async.

## [1.1.2] - 2024-07-08

### Fixed

- Get Redis Value logic.

## [1.1.1] - 2024-07-04

### Changed

- Logic with HOST variables.

## [1.1.0] - 2024-06-29

### Added

- Redis (Remote Dictionary Service).

### Changed

- Cache data now in Redis instead of regular memory.
- Some variables (.env) have been renamed.
- Removed MQTT Explorer.

## [1.0.5] - 2024-06-11

### Added

- Ability to connect to MQTT using TLS.

### Changed

- Environment variables.
- mosquitto.conf (added to .gitignore also)

## [1.0.4] - 2024-05-15

### Fixed

- Command Topic Data in the Devices Action (User Controller).

## [1.0.3] - 2024-05-13

### Changed

- Adjusted ["MQTT Message" => "Alice Value"] config mapping ("valueMapping" changed to "messageValueMapping").

## [1.0.2] - 2024-05-07

### Removed

- English locale from the "i18n" configuration.

## [1.0.1] - 2024-05-06

### Added

- Possibility for finding topics with Type & State Instance conditions.
- Value Mapping to the MQTT Command Topic Interface.

### Changed

- Methods convertAliceValueToMqttMessage and convertMqttMessageToAliceValue are async now.

### Removed

- MqttConvertData type, and used CommandTopicData instead.

## [1.0.0] - 2024-05-02

### Added

- Initial stable release.