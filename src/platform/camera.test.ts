import { WebCamera, frameFromFile } from './camera';

// Not in the brief (real media is E2E): these pin the sizing rule, bitmap release and the camera-off guarantees with fakes.
// jsdom has no 2D canvas, media devices or image bitmaps, so deleting the stubs restores it.
afterEach(() => { vi.restoreAllMocks(); delete (navigator as any).mediaDevices; delete (globalThis as any).createImageBitmap; });

const stubCanvas = () => {
  const ctx = { canvas: { width: 0, height: 0 }, drawImage: vi.fn(), getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) })) };
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never);
  return { ctx, getContext };
};
const stubBitmap = (width: number, height: number) => { const close = vi.fn(); (globalThis as any).createImageBitmap = vi.fn(async () => ({ width, height, close })); return close; };
const fakeStream = () => { const track = { stop: vi.fn() }; return { track, stream: { getTracks: () => [track] } }; };
const stubMedia = (...results: Promise<unknown>[]) => { const getUserMedia = vi.fn(() => results.shift()!); Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true }); return getUserMedia; };
const fakeVideo = (play = vi.fn(async () => {})) => ({ video: { srcObject: null, playsInline: false, muted: false, play } as unknown as HTMLVideoElement, play });
const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });

test('grabFrame: null בלי וידאו, רוחב היעד ושמירת יחס, גובה עד פעמיים הרוחב, canvas אחד', () => {
  const { ctx, getContext } = stubCanvas(); const cam = new WebCamera();
  const video = (videoWidth: number, videoHeight: number) => ({ videoWidth, videoHeight }) as HTMLVideoElement;
  expect(cam.grabFrame(video(0, 0), 256)).toBeNull();
  const f = cam.grabFrame(video(640, 480), 256)!;
  expect([f.width, f.height, f.data.length]).toEqual([256, 192, 256 * 192 * 4]);
  expect(ctx.drawImage).toHaveBeenLastCalledWith(expect.anything(), 0, 0, 256, 192);
  const tall = cam.grabFrame(video(300, 1200), 256)!;
  expect([tall.width, tall.height]).toEqual([128, 512]);
  expect(getContext).toHaveBeenCalledTimes(1); expect(getContext).toHaveBeenCalledWith('2d', { willReadFrequently: true });
});
test('frameFromFile: אותו כלל גודל, וה-bitmap נסגר', async () => {
  stubCanvas(); const close = stubBitmap(1000, 3000);
  const f = await frameFromFile(file, 256);
  expect([f.width, f.height]).toEqual([171, 512]); expect(close).toHaveBeenCalledTimes(1);
});
test('frameFromFile: פענוח נכשל, אין createImageBitmap, או אין הקשר ציור → unsupported, וה-bitmap נסגר', async () => {
  (globalThis as any).createImageBitmap = vi.fn(async () => { throw new DOMException('bad image', 'InvalidStateError'); });
  await expect(frameFromFile(file, 256)).rejects.toThrow('unsupported');
  delete (globalThis as any).createImageBitmap;
  await expect(frameFromFile(file, 256)).rejects.toThrow('unsupported');
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null); const close = stubBitmap(10, 10);
  await expect(frameFromFile(file, 256)).rejects.toThrow('unsupported'); expect(close).toHaveBeenCalledTimes(1);
});
test('start: מצלמה אחורית, וידאו מושתק ו-inline שמתנגן; start נוסף עוצר את הקודם; stop עוצר ומנקה', async () => {
  const first = fakeStream(), second = fakeStream(); const getUserMedia = stubMedia(Promise.resolve(first.stream), Promise.resolve(second.stream));
  const { video, play } = fakeVideo(); const cam = new WebCamera();
  await cam.start(video);
  expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: { ideal: 'environment' } }, audio: false });
  expect(video).toMatchObject({ srcObject: first.stream, playsInline: true, muted: true }); expect(play).toHaveBeenCalledTimes(1);
  await cam.start(video);
  expect(first.track.stop).toHaveBeenCalled(); expect(video.srcObject).toBe(second.stream);
  cam.stop();
  expect(second.track.stop).toHaveBeenCalled(); expect(video.srcObject).toBeNull();
});
test('stop בזמן בקשת ההרשאה: הזרם שמגיע אחר כך נעצר והמצלמה לא נדלקת', async () => {
  const s = fakeStream(); let grant!: (stream: unknown) => void; stubMedia(new Promise(r => (grant = r)));
  const { video, play } = fakeVideo(); const cam = new WebCamera();
  const started = cam.start(video); cam.stop(); grant(s.stream); await started;
  expect(s.track.stop).toHaveBeenCalled(); expect(video.srcObject).toBeNull(); expect(play).not.toHaveBeenCalled();
});
test('play נכשל: המצלמה נכבית והשגיאה עוברת הלאה', async () => {
  const s = fakeStream(); stubMedia(Promise.resolve(s.stream));
  const { video } = fakeVideo(vi.fn(() => Promise.reject(new DOMException('blocked', 'NotAllowedError')))); const cam = new WebCamera();
  await expect(cam.start(video)).rejects.toThrow('blocked');
  expect(s.track.stop).toHaveBeenCalled(); expect(video.srcObject).toBeNull();
});
test('בלי mediaDevices (הקשר לא מאובטח): start נדחה ולא זורק', async () => { await expect(new WebCamera().start(fakeVideo().video)).rejects.toThrow(); });
test('play של start קודם שנכשל אחרי start חדש לא מכבה את החדש', async () => {
  const s1 = fakeStream(), s2 = fakeStream(); stubMedia(Promise.resolve(s1.stream), Promise.resolve(s2.stream));
  let failPlay!: (e: unknown) => void;
  const play = vi.fn<() => Promise<void>>().mockReturnValueOnce(new Promise<void>((_, reject) => (failPlay = reject))).mockResolvedValue(undefined);
  const { video } = fakeVideo(play); const cam = new WebCamera();
  const first = cam.start(video); await vi.waitFor(() => expect(play).toHaveBeenCalled());
  const second = cam.start(video); failPlay(new DOMException('interrupted', 'AbortError'));
  await expect(first).rejects.toThrow('interrupted'); await second;
  expect(video.srcObject).toBe(s2.stream); expect(s2.track.stop).not.toHaveBeenCalled();
});
