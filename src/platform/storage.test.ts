import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './storage';

afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

test('ברירת מחדל כשאין כלום', () => { localStorage.clear(); expect(loadSettings()).toEqual({ speech: true, haptics: true }); });
test('שמירה וטעינה', () => { saveSettings({ speech: false, haptics: true }); expect(loadSettings()).toEqual({ speech: false, haptics: true }); });
test('JSON שבור → ברירת מחדל', () => { localStorage.setItem('solanisense.settings', '{bad'); expect(loadSettings()).toEqual(DEFAULT_SETTINGS); });

// Added: a wrong shape, extra fields, and storage that throws (blocked, private mode, quota)
test.each(['null', '[]', '"x"', '{"speech":"no","haptics":true}', '{"speech":false}'])('צורה לא תקינה %s → ברירת מחדל', raw => { localStorage.setItem('solanisense.settings', raw); expect(loadSettings()).toEqual(DEFAULT_SETTINGS); });
test('נטענים רק שני השדות', () => { localStorage.setItem('solanisense.settings', '{"speech":false,"haptics":false,"x":1}'); expect(loadSettings()).toEqual({ speech: false, haptics: false }); });
test('אחסון שזורק: טעינה מחזירה ברירת מחדל ושמירה לא זורקת', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError'); });
  expect(loadSettings()).toEqual(DEFAULT_SETTINGS); expect(() => saveSettings({ speech: false, haptics: false })).not.toThrow();
});
test('ברירת המחדל מוחזרת כעותק', () => { loadSettings().speech = false; expect(DEFAULT_SETTINGS).toEqual({ speech: true, haptics: true }); });
