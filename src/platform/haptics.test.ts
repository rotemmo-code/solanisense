import { VIBRATION, WebHaptics } from './haptics';

afterEach(() => { delete (navigator as any).vibrate; }); // jsdom has no vibrate, so deleting restores it

test('דפוסי רטט לפי רמה', () => { expect(VIBRATION.none).toEqual([]); expect(VIBRATION.local).toEqual([200]); expect(VIBRATION.widespread).toEqual([200, 100, 200, 100, 200]); });
test('בלי navigator.vibrate לא זורק', () => { Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true }); expect(() => new WebHaptics().vibrate('widespread')).not.toThrow(); });
test('קורא ל-vibrate עם הדפוס', () => { const spy = vi.fn(); Object.defineProperty(navigator, 'vibrate', { value: spy, configurable: true }); new WebHaptics().vibrate('local'); expect(spy).toHaveBeenCalledWith([200]); });

// Added: 'none' leaves the motor alone, and vibrate is called on navigator itself (browsers throw on a detached call)
test('none לא שולח כלום (דפוס ריק היה עוצר רטט פעיל)', () => { const spy = vi.fn(); Object.defineProperty(navigator, 'vibrate', { value: spy, configurable: true }); new WebHaptics().vibrate('none'); expect(spy).not.toHaveBeenCalled(); });
test('vibrate נקרא על navigator עצמו', () => { const spy = vi.fn(); Object.defineProperty(navigator, 'vibrate', { value: spy, configurable: true }); new WebHaptics().vibrate('widespread'); expect(spy).toHaveBeenCalledWith([200, 100, 200, 100, 200]); expect(spy.mock.contexts[0]).toBe(navigator); });
