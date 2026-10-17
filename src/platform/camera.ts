import type { Frame } from '../core/analyzer/types';

export interface Camera { start(video: HTMLVideoElement): Promise<void>; stop(): void; grabFrame(video: HTMLVideoElement, targetWidth: number): Frame | null; }

const context2d = () => document.createElement('canvas').getContext('2d', { willReadFrequently: true });
const stopTracks = (stream: MediaStream) => stream.getTracks().forEach(t => t.stop());

// targetWidth wide with the aspect ratio kept; a source taller than 2:1 shrinks further so the height stops at 2 * targetWidth
function toFrame(ctx: CanvasRenderingContext2D, source: CanvasImageSource, sourceWidth: number, sourceHeight: number, targetWidth: number): Frame {
  const scale = Math.min(targetWidth / sourceWidth, (targetWidth * 2) / sourceHeight);
  const width = Math.max(1, Math.round(sourceWidth * scale)), height = Math.max(1, Math.round(sourceHeight * scale));
  ctx.canvas.width = width; // resizing also clears whatever the previous frame left
  ctx.canvas.height = height;
  ctx.drawImage(source, 0, 0, width, height);
  return { width, height, data: ctx.getImageData(0, 0, width, height).data };
}

export class WebCamera implements Camera {
  #stream: MediaStream | null = null;
  #video: HTMLVideoElement | null = null;
  #session = 0; // bumped by stop(), so a start() still waiting for permission knows it was cancelled
  #ctx: CanvasRenderingContext2D | null = null;

  async start(video: HTMLVideoElement): Promise<void> {
    this.stop();
    const session = this.#session;
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    // stop() or a newer start() ran while the permission prompt was open: the camera must not come on
    if (session !== this.#session) { stopTracks(stream); return; }
    this.#stream = stream;
    this.#video = video;
    video.playsInline = true;
    video.muted = true;
    video.srcObject = stream;
    try {
      await video.play();
    } catch (e) {
      if (session === this.#session) this.stop(); // a failed start must not leave the camera on
      throw e;
    }
  }

  stop(): void {
    this.#session++;
    if (this.#stream) stopTracks(this.#stream);
    if (this.#video) this.#video.srcObject = null;
    this.#stream = null;
    this.#video = null;
  }

  grabFrame(video: HTMLVideoElement, targetWidth: number): Frame | null {
    if (video.videoWidth === 0) return null;
    this.#ctx ??= context2d();
    return this.#ctx ? toFrame(this.#ctx, video, video.videoWidth, video.videoHeight, targetWidth) : null;
  }
}

export async function frameFromFile(file: File, targetWidth: number): Promise<Frame> {
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
    const ctx = context2d();
    if (!ctx) throw new Error('no 2d context');
    // shortcut: transparent PNG pixels read back as black, upgrade by painting a white background first if cut-out images matter
    return toFrame(ctx, bitmap, bitmap.width, bitmap.height, targetWidth);
  } catch (e) {
    throw new Error('unsupported', { cause: e });
  } finally {
    bitmap?.close();
  }
}
