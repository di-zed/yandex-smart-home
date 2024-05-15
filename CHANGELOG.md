# CHANGE LOG

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