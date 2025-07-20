# CHANGE LOG

## [1.6.7] - 2025-07-21

### Added

- Skip the wrong capability mode options if needed.

## [1.6.6] - 2025-04-25

### Fixed

- package.json and package-lock.json.

## [1.6.5] - 2025-04-25

### Fixed

- Frequent server requests for anonymous users (if the user has already been checked and has not been found within the last five minutes, we will not check again to avoid spam).

## [1.6.4] - 2025-03-10

### Changed

- Change error code from "INVALID_ACTION" to "DEVICE_UNREACHABLE" for the action of the device.

## [1.6.3] - 2025-02-27

### Changed

- Logic for "isDeviceAvailable" checking.
- Status "DEVICE_NOT_FOUND -> DEVICE_UNREACHABLE" for not founded devices. 

## [1.6.2] - 2025-01-11

### Changed

- MQTT connection configuration.

## [1.6.1] - 2025-01-06

### Fixed

- Handling "DEVICE_UNREACHABLE" error logic.

## [1.6.0] - 2025-01-03

### Added

- Possibility to set "DEVICE_UNREACHABLE" status for offline devices.

### Changed

- Code refactoring.

## [1.5.5] - 2024-11-22

### Added

- Lifetime for the Available and State topics.

## [1.5.4] - 2024-11-11

### Changed

- Callback methods: callbackRestUserDevicesAction.

## [1.5.3] - 2024-11-11

### Added

- New callback methods: callbackRestUserDevicesAction.

## [1.5.2] - 2024-11-09

### Changed

- Yandex Callbacks initialization.
- Callback methods: callbackSkillState, callbackSkillDiscovery.

## [1.5.1] - 2024-11-04

### Added

- New callback methods: callbackSkillState, callbackSkillDiscovery.

### Changed

- Callback Discovery logic.

## [1.5.0] - 2024-11-02

### Added

- Notification about device parameter change.

## [1.4.6] - 2024-10-29

### Fixed

- Device "event" property handling.

## [1.4.5] - 2024-09-25

### Fixed

- Convert MQTT Message to Alice Value.

## [1.4.4] - 2024-09-21

### Fixed

- Improved comparison of emails and topic values.

## [1.4.3] - 2024-09-09

### Fixed

- Fixed build package.

## [1.4.2] - 2024-09-09

### Changed

- "topicStateKey" -> "topicStateKeys". It can be helpful if you have a couple of topic versions on different devices.

### Fixed

- Changing device range capability value with the relative flag.

## [1.4.1] - 2024-09-07

### Fixed

- Now the logs are more understandable and convenient.

## [1.4.0] - 2024-09-06

### Added

- Lifetime for Set topics.
- Possibility to read data from State topics for devices.
- Couple of new callbacks: callbackIsSkillCallbackStateAvailable, callbackIsSkillDeviceAvailable.
- Simple validation for the login form.

### Fixed

- "getUserById" method. User IDs comparing.

## [1.3.1] - 2024-08-24

### Fixed

- Notification about device state change for the Command Topics only.

## [1.3.0] - 2024-08-21

### Added

- Notification about device state change.

### Fixed

- ENV initialization.
- Content Security Policy rules.

## [1.2.2] - 2024-08-17

### Fixed

- Builded the project.

## [1.2.1] - 2024-08-17

### Changed

- User and Client models.
- Response error codes.

### Fixed

- The User ID can now be a string.
- Content Security Policy rules.

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