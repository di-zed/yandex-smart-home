/**
 * @author DiZed Team
 * @copyright Copyright (c) DiZed Team (https://github.com/di-zed/)
 */
import { Capability, CapabilityParameters, CapabilityState } from '../capability';

/**
 * Export "video_stream" capability.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/video_stream.html?lang=en
 *
 * @interface
 */
export interface VideoStreamCapability extends Capability {
  /**
   * Type of capability.
   */
  readonly type: 'devices.capabilities.video_stream';

  /**
   * The parameters object.
   */
  parameters?: VideoStreamCapabilityParameters;

  /**
   * Capability state parameters.
   */
  state?: VideoStreamCapabilityState;
}

/**
 * The parameters object.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/video_stream.html?lang=en#discovery
 *
 * @interface
 */
export interface VideoStreamCapabilityParameters extends CapabilityParameters {
  /**
   * It currently supports only the HLS streaming protocol.
   * Supported video codecs: H264.
   * Maximum video resolution: 1920 × 1080.
   * Supported audio codecs: AAC.
   */
  protocols: VideoStreamCapabilityProtocol[];
}

/**
 * Capability state parameters.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/video_stream.html?lang=en#state
 *
 * @interface
 */
export interface VideoStreamCapabilityState extends CapabilityState {
  /**
   * The function of the capability. Acceptable values: "get_stream".
   */
  readonly instance: VideoStreamCapabilityInstance;

  /**
   * Parameters of the video stream.
   */
  value: VideoStreamCapabilityStateValue;
}

/**
 * It currently supports only the HLS streaming protocol.
 * Supported video codecs: H264.
 * Maximum video resolution: 1920 × 1080.
 * Supported audio codecs: AAC.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/video_stream.html?lang=en#discovery__parameters
 *
 * @type
 */
export type VideoStreamCapabilityProtocol = 'hls';

/**
 * The function of the capability. Acceptable values: "get_stream".
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/video_stream.html?lang=en#action__parameters_1
 *
 * @type
 */
export type VideoStreamCapabilityInstance = 'get_stream';

/**
 * Parameters of the video stream.
 * https://yandex.ru/dev/dialogs/smart-home/doc/concepts/video_stream.html?lang=en#action__parameters_1
 *
 * @type
 */
export type VideoStreamCapabilityStateValue = {
  stream_url: string;
  protocol: VideoStreamCapabilityProtocol;
};
