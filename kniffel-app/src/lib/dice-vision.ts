export type BBox = { x: number; y: number; width: number; height: number };
export type PipDetection = { x: number; y: number; radius: number };
export type DieDetection = {
  value: number | null;
  confidence: number;
  bbox: BBox;
  pips: PipDetection[];
  isReliable: boolean;
};

const NORMALIZED_SIZE = 200;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function grayscale(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    gray[i] = Math.round(0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]);
  }
  return gray;
}

function boxBlur(gray: Uint8Array, width: number, height: number, radius = 1): Uint8Array {
  const out = new Uint8Array(width * height);
  const size = radius * 2 + 1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      let count = 0;
      for (let yy = y - radius; yy <= y + radius; yy += 1) {
        for (let xx = x - radius; xx <= x + radius; xx += 1) {
          if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
          sum += gray[yy * width + xx];
          count += 1;
        }
      }
      out[y * width + x] = Math.round(sum / Math.max(1, count));
    }
  }
  return size > 1 ? out : gray;
}

function adaptiveBrightMask(gray: Uint8Array, width: number, height: number): Uint8Array {
  const blur = boxBlur(gray, width, height, 5);
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i += 1) {
    mask[i] = gray[i] > blur[i] + 12 ? 1 : 0;
  }
  return mask;
}

type Comp = { minX: number; minY: number; maxX: number; maxY: number; area: number; cx: number; cy: number };

function connectedComponents(mask: Uint8Array, width: number, height: number): Comp[] {
  const visited = new Uint8Array(width * height);
  const qx = new Int32Array(width * height);
  const qy = new Int32Array(width * height);
  const comps: Comp[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (!mask[idx] || visited[idx]) continue;
      let head = 0;
      let tail = 0;
      let area = 0;
      let sumX = 0;
      let sumY = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      visited[idx] = 1;
      qx[tail] = x;
      qy[tail] = y;
      tail += 1;
      while (head < tail) {
        const cx = qx[head];
        const cy = qy[head];
        head += 1;
        area += 1;
        sumX += cx;
        sumY += cy;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        const n = [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]];
        for (const [nx, ny] of n) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nidx = ny * width + nx;
          if (!mask[nidx] || visited[nidx]) continue;
          visited[nidx] = 1;
          qx[tail] = nx;
          qy[tail] = ny;
          tail += 1;
        }
      }
      comps.push({ minX, minY, maxX, maxY, area, cx: sumX / area, cy: sumY / area });
    }
  }
  return comps;
}

export function detectDice(image: ImageData): BBox[] {
  const { data, width, height } = image;
  const gray = grayscale(data, width, height);
  const mask = adaptiveBrightMask(gray, width, height);
  const comps = connectedComponents(mask, width, height);
  const minArea = (width * height) / 300;
  const maxArea = (width * height) / 3;

  return comps
    .map((c) => ({ x: c.minX, y: c.minY, width: c.maxX - c.minX + 1, height: c.maxY - c.minY + 1, area: c.area }))
    .filter((c) => {
      const aspect = c.width / c.height;
      return c.area >= minArea && c.area <= maxArea && aspect > 0.6 && aspect < 1.5;
    })
    .sort((a, b) => b.area - a.area)
    .slice(0, 5)
    .map((candidate) => ({
      x: candidate.x,
      y: candidate.y,
      width: candidate.width,
      height: candidate.height
    }));
}

export function normalizeDie(image: ImageData, bbox: BBox): ImageData {
  const out = new ImageData(NORMALIZED_SIZE, NORMALIZED_SIZE);
  const sx0 = Math.floor(clamp(bbox.x, 0, image.width - 1));
  const sy0 = Math.floor(clamp(bbox.y, 0, image.height - 1));
  const sw = Math.max(1, Math.floor(clamp(bbox.width, 1, image.width - sx0)));
  const sh = Math.max(1, Math.floor(clamp(bbox.height, 1, image.height - sy0)));

  for (let y = 0; y < NORMALIZED_SIZE; y += 1) {
    for (let x = 0; x < NORMALIZED_SIZE; x += 1) {
      const sx = sx0 + Math.floor((x / NORMALIZED_SIZE) * sw);
      const sy = sy0 + Math.floor((y / NORMALIZED_SIZE) * sh);
      const src = (sy * image.width + sx) * 4;
      const dst = (y * NORMALIZED_SIZE + x) * 4;
      out.data[dst] = image.data[src];
      out.data[dst + 1] = image.data[src + 1];
      out.data[dst + 2] = image.data[src + 2];
      out.data[dst + 3] = 255;
    }
  }
  return out;
}

export function detectPips(dieImage: ImageData): PipDetection[] {
  const { data, width, height } = dieImage;
  const gray = grayscale(data, width, height);
  const blurred = boxBlur(gray, width, height, 2);
  let sum = 0;
  for (const v of blurred) sum += v;
  const mean = sum / blurred.length;
  const darkMask = new Uint8Array(width * height);

  const margin = 16;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (x < margin || y < margin || x >= width - margin || y >= height - margin) {
        darkMask[idx] = 0;
      } else {
        darkMask[idx] = blurred[idx] < mean - 22 ? 1 : 0;
      }
    }
  }

  const comps = connectedComponents(darkMask, width, height);
  const minArea = (width * height) / 3000;
  const maxArea = (width * height) / 80;

  return comps
    .filter((c) => {
      const bw = c.maxX - c.minX + 1;
      const bh = c.maxY - c.minY + 1;
      const aspect = bw / bh;
      const circularity = c.area / (Math.PI * Math.pow((bw + bh) / 4, 2));
      return c.area >= minArea && c.area <= maxArea && aspect > 0.55 && aspect < 1.8 && circularity > 0.4;
    })
    .map((c) => ({ x: c.cx, y: c.cy, radius: Math.sqrt(c.area / Math.PI) }));
}

export function classifyDie(pips: PipDetection[]): { value: number | null; confidence: number; isReliable: boolean } {
  const raw = pips.length;
  if (raw < 1 || raw > 6) return { value: null, confidence: 0, isReliable: false };
  const value = raw;
  const shapeScore = pips.length === 0 ? 0 : pips.reduce((s, p) => s + clamp(1 - Math.abs(p.radius - 7) / 10, 0, 1), 0) / pips.length;
  const countScore = 1;
  const confidence = clamp(0.5 * countScore + 0.5 * shapeScore, 0, 1);
  return { value, confidence, isReliable: confidence >= 0.55 };
}

export function scanDice(image: ImageData): DieDetection[] {
  const dice = detectDice(image);
  const results: DieDetection[] = [];
  for (const bbox of dice) {
    const normalized = normalizeDie(image, bbox);
    const pips = detectPips(normalized);
    const cls = classifyDie(pips);
    results.push({ ...cls, bbox, pips });
  }
  return results.sort((a, b) => (a.value ?? 99) - (b.value ?? 99));
}
