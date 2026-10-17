import type { Frame } from './types';

// Opaque RGBA frame from a per-pixel color, for synthetic analyzer tests
export function makeFrame(width: number, height: number, fill: (x: number, y: number) => [number, number, number]): Frame {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data.set([...fill(x, y), 255], (y * width + x) * 4);
  return { width, height, data };
}
