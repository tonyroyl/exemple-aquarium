// Génère de petites icônes PNG (192x192, 512x512, maskable) sans dépendance externe,
// en construisant le format PNG à la main (zlib est le seul module utilisé).
// Design volontairement minimal : fond bleu nuit + verre/losange ambre, en attendant
// qu'un vrai logo soit fourni.
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(OUT_DIR, { recursive: true });

const NAVY_RGB = [15, 42, 61];
const AMBER_RGB = [224, 160, 48];

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function buildPng(size, { maskablePadding = 0 } = {}) {
  const width = size;
  const height = size;
  const raw = Buffer.alloc((width * 3 + 1) * height);

  const margin = maskablePadding ? Math.round(size * 0.15) : 0;
  const glassLeft = margin + Math.round((width - 2 * margin) * 0.32);
  const glassRight = width - margin - Math.round((width - 2 * margin) * 0.32);
  const glassTopY = margin + Math.round((height - 2 * margin) * 0.22);
  const glassBottomY = height - margin - Math.round((height - 2 * margin) * 0.28);
  const stemBottomY = height - margin - Math.round((height - 2 * margin) * 0.12);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 3 + 1);
    raw[rowStart] = 0; // filter type: none
    for (let x = 0; x < width; x++) {
      let color = NAVY_RGB;

      // Forme simple de verre à cocktail (triangle) en amber sur fond navy.
      if (y >= glassTopY && y <= glassBottomY) {
        const t = (y - glassTopY) / Math.max(1, glassBottomY - glassTopY);
        const halfWidth = ((glassRight - glassLeft) / 2) * t;
        const centerX = width / 2;
        if (x >= centerX - halfWidth && x <= centerX + halfWidth) {
          color = AMBER_RGB;
        }
      } else if (y > glassBottomY && y <= stemBottomY) {
        const centerX = width / 2;
        const stemHalf = Math.max(1, Math.round(size * 0.015));
        if (x >= centerX - stemHalf && x <= centerX + stemHalf) {
          color = AMBER_RGB;
        }
      }

      const pixelStart = rowStart + 1 + x * 3;
      raw[pixelStart] = color[0];
      raw[pixelStart + 1] = color[1];
      raw[pixelStart + 2] = color[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const targets = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-512.png', size: 512, maskablePadding: true },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const t of targets) {
  const png = buildPng(t.size, { maskablePadding: t.maskablePadding });
  fs.writeFileSync(path.join(OUT_DIR, t.name), png);
  console.log(`Généré ${t.name} (${t.size}x${t.size}, ${png.length} octets)`);
}
