const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createPNG(width, height, drawFn) {
  const bytesPerPixel = 4;
  const rawData = Buffer.alloc(height * (1 + width * bytesPerPixel));
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * bytesPerPixel);
    rawData[rowOffset] = 0; // Filter type 0: None
    
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawFn(x / width, y / height, x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    
    // Compute CRC32
    let crc = 0xFFFFFFFF;
    for (let i = 4; i < 8 + len; i++) {
      crc = updateCRC(crc, buf[i]);
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0;
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // Precomputed CRC table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xEDB88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }
  function updateCRC(crc, byte) {
    return crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function drawIcon(u, v, x, y, w, h) {
  // Center is (0.5, 0.5)
  const dx = u - 0.5;
  const dy = v - 0.5;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background: Deep obsidian/midnight gradient (#0B0F19 to #1E1B4B)
  let bgR = Math.round(11 + (1 - v) * 15);
  let bgG = Math.round(15 + (1 - v) * 12);
  let bgB = Math.round(25 + (1 - v) * 45);
  let bgA = 255;

  // Rounded rectangle icon badge
  const cornerR = 0.22;
  const qx = Math.max(0, Math.abs(dx) - (0.45 - cornerR));
  const qy = Math.max(0, Math.abs(dy) - (0.45 - cornerR));
  const cornerDist = Math.sqrt(qx * qx + qy * qy);
  if (cornerDist > cornerR) {
    return [0, 0, 0, 0]; // Transparent outside icon shape
  }

  // Golden border
  if (cornerDist > cornerR - 0.03 || (Math.abs(dx) > 0.42 && Math.abs(dy) <= 0.42) || (Math.abs(dy) > 0.42 && Math.abs(dx) <= 0.42)) {
    return [234, 179, 8, 255]; // Gold #EAB308
  }

  // Draw an open illuminated book with a glowing central star
  // Left page
  const leftPage = (u >= 0.22 && u <= 0.47 && v >= 0.35 && v <= 0.72);
  // Right page
  const rightPage = (u >= 0.53 && u <= 0.78 && v >= 0.35 && v <= 0.72);
  // Spine
  const spine = (Math.abs(u - 0.5) < 0.03 && v >= 0.38 && v <= 0.72);

  // Radiant central star at top (u=0.5, v=0.28)
  const starDist = Math.sqrt((u - 0.5) * (u - 0.5) + (v - 0.28) * (v - 0.28));
  if (starDist < 0.12) {
    // 4-point star
    const sx = Math.abs(u - 0.5);
    const sy = Math.abs(v - 0.28);
    if ((sx < 0.03 && sy < 0.11) || (sy < 0.03 && sx < 0.11) || (sx + sy < 0.08)) {
      return [254, 240, 138, 255]; // Radiant pale gold glow
    }
  }

  if (spine) {
    return [180, 130, 30, 255]; // Dark gold spine
  }

  if (leftPage || rightPage) {
    // Page gradient: Warm parchment white with gold gilded edges
    const edge = (v < 0.37 || v > 0.70 || (leftPage && u < 0.24) || (rightPage && u > 0.76));
    if (edge) {
      return [245, 158, 11, 255]; // Gold foil accent
    }
    // Lines of prose
    const lineV = Math.floor((v - 0.38) * 40);
    if (lineV >= 1 && lineV <= 11 && lineV % 2 === 0) {
      return [160, 140, 120, 255]; // Faint manuscript line
    }
    return [248, 244, 235, 255]; // Parchment
  }

  // Sparkles
  if ((Math.abs(u - 0.2) < 0.02 && Math.abs(v - 0.22) < 0.02) ||
      (Math.abs(u - 0.8) < 0.02 && Math.abs(v - 0.25) < 0.02)) {
    return [234, 179, 8, 220];
  }

  return [bgR, bgG, bgB, bgA];
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

[16, 48, 128].forEach(size => {
  const png = createPNG(size, size, drawIcon);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png (${size}x${size})`);
});

