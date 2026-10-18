// Marks for green pixels, drawn on any 2D context; no React, so the live scan and the result screen share it and it tests with a fake context.

/** 1 for each green pixel that has a non-green 4-neighbor; outside the frame counts as non-green */
export function outlineOf(mask: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(mask.length);
  const green = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x] === 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (green(x, y) && !(green(x - 1, y) && green(x + 1, y) && green(x, y - 1) && green(x, y + 1))) out[y * width + x] = 1;
    }
  }
  return out;
}

/** Diagonal stripes inside the mask and an outline around it, white edged in black so they show on any background. Mask pixel (x, y) lands at (x * scaleX, y * scaleY). */
export function drawOverlay(ctx: CanvasRenderingContext2D, mask: Uint8Array, width: number, height: number, scaleX: number, scaleY: number): void {
  if (!mask.includes(1)) return;
  ctx.save();
  ctx.beginPath();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] !== 1) continue;
      const start = x;
      while (x + 1 < width && mask[y * width + x + 1] === 1) x++;
      ctx.rect(start * scaleX, y * scaleY, (x + 1 - start) * scaleX, scaleY); // one rect per run of green in the row, not one per pixel
    }
  }
  ctx.clip();
  ctx.beginPath();
  const w = width * scaleX, h = height * scaleY;
  for (let d = -h; d < w; d += 6 * Math.SQRT2) { ctx.moveTo(d, 0); ctx.lineTo(d + h, h); } // 45° stripes 6px apart, measured across them
  ctx.strokeStyle = 'black'; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
  // a box of at least 3px on every outline pixel, so the line has no gaps at any scale
  const bw = Math.max(3, scaleX), bh = Math.max(3, scaleY);
  ctx.beginPath();
  outlineOf(mask, width, height).forEach((v, i) => { if (v) ctx.rect(((i % width) + 0.5) * scaleX - bw / 2, (Math.floor(i / width) + 0.5) * scaleY - bh / 2, bw, bh); });
  ctx.strokeStyle = 'black'; ctx.lineWidth = 2; ctx.stroke(); // the white fill then covers the inner half, leaving a 1px black edge
  ctx.fillStyle = 'white'; ctx.fill();
}

/** The analyzed ellipse (spec 4.1) as a 2px white dashed line over a black halo, centered in a width x height picture, so the user can fill it with the potato */
export function drawRoiGuide(ctx: CanvasRenderingContext2D, width: number, height: number, fraction: number): void {
  ctx.save(); // the dash must not leak into the marks drawn next
  ctx.beginPath();
  ctx.ellipse(width / 2, height / 2, (fraction * width) / 2, (fraction * height) / 2, 0, 0, 2 * Math.PI);
  ctx.strokeStyle = 'black'; ctx.lineWidth = 4; ctx.stroke(); // 1px of black on each side of the white line, and in its gaps
  ctx.setLineDash([8, 6]); ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
