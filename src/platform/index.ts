import { type Camera, WebCamera } from './camera';
import { type Haptics, WebHaptics } from './haptics';
import { type Speech, WebSpeech } from './speech';

// typed by the interfaces so the UI cannot reach past them; a Capacitor port swaps these three implementations
export const platform: { camera: Camera; speech: Speech; haptics: Haptics } = { camera: new WebCamera(), speech: new WebSpeech(), haptics: new WebHaptics() };
