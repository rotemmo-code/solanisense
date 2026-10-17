// One-off: writes the e2e upload fixtures (committed, so CI never regenerates them). Run: node scripts/make-fixtures.mjs
import { BROWN, GREEN, inSpot, writePng } from './synthetic.mjs';

const dir = new URL('../e2e/fixtures/', import.meta.url);
writePng(new URL('brown.png', dir), () => BROWN);
writePng(new URL('green-spot.png', dir), (x, y) => (inSpot(x, y) ? GREEN : BROWN));
