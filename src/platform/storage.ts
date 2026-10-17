export interface Settings { speech: boolean; haptics: boolean }
export const DEFAULT_SETTINGS: Settings = { speech: true, haptics: true };
const KEY = 'solanisense.settings';

export function loadSettings(): Settings {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (typeof s?.speech === 'boolean' && typeof s.haptics === 'boolean') return { speech: s.speech, haptics: s.haptics };
  } catch { /* storage blocked or broken JSON: use the defaults */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s: Settings): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked or full: the settings still hold for this session */ }
}
