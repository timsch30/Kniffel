export type BoundingBox = { x: number; y: number; width: number; height: number };

export type DieCandidate = {
  bbox: BoundingBox;
  area: number;
  aspectRatio: number;
  extent: number;
};

export type PipDetection = {
  x: number;
  y: number;
  radius: number;
  area: number;
  circularity: number;
  contrast: number;
};

export type DieClassification = {
  value: number | null;
  confidence: number;
  isReliable: boolean;
  diagnostics: {
    pipCount: number;
    patternScore: number;
  };
};

export type DieDetection = {
  value: number | null;
  confidence: number;
  isReliable: boolean;
  bbox: BoundingBox;
  pips: Array<{ x: number; y: number; radius: number }>;
};

const DIE_SIZE = 200;
const BORDER_MARGIN = 0.12;

function toGray(image: ImageData): Uint8ClampedArray {
  const gray = new Uint8ClampedArray(image.width * image.height);
  for (let i = 0, p = 0; i < image.data.length; i += 4, p += 1) {
    const r = image.data[i] ?? 0;
    const g = image.data[i + 1] ?? 0;
    const b = image.data[i + 2] ?? 0;
    gray[p] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return gray;
}

function boxBlur(src: Uint8ClampedArray, width: number, height: number, radius = 2): Uint8ClampedArray {
  const out = new Uint8ClampedArray(src.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy += 1) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -radius; dx <= radius; dx += 1) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          sum += src[yy * width + xx] ?? 0;
          count += 1;
        }
      }
      out[y * width + x] = Math.round(sum / Math.max(1, count));
    }
  }
  return out;
}

function adaptiveThreshold(src: Uint8ClampedArray, width: number, height: number, window = 15, c = 8): Uint8Array {
  const half = Math.floor(window / 2);
  const out = new Uint8Array(src.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      let count = 0;
      for (let dy = -half; dy <= half; dy += 1) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -half; dx <= half; dx += 1) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          sum += src[yy * width + xx] ?? 0;
          count += 1;
        }
      }
      const mean = sum / Math.max(1, count);
      out[y * width + x] = (src[y * width + x] ?? 0) < mean - c ? 1 : 0;
    }
  }
  return out;
}

function morphology(binary: Uint8Array, width: number, height: number): Uint8Array {
  const eroded = new Uint8Array(binary.length);
  const dilated = new Uint8Array(binary.length);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let all = 1;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if ((binary[(y + dy) * width + (x + dx)] ?? 0) === 0) all = 0;
        }
      }
      eroded[y * width + x] = all;
    }
  }
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let any = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if ((eroded[(y + dy) * width + (x + dx)] ?? 0) === 1) any = 1;
        }
      }
      dilated[y * width + x] = any;
    }
  }
  return dilated;
}

function connectedComponents(binary: Uint8Array, width: number, height: number) {
  const visited = new Uint8Array(binary.length);
  const components: Array<{ area: number; minX: number; minY: number; maxX: number; maxY: number }> = [];
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (visited[idx] || binary[idx] === 0) continue;
      let area = 0, minX = x, minY = y, maxX = x, maxY = y;
      const q: Array<[number,number]> = [[x,y]];
      visited[idx] = 1;
      while (q.length) {
        const [cx, cy] = q.pop() as [number,number];
        area += 1;
        minX = Math.min(minX, cx); minY = Math.min(minY, cy); maxX = Math.max(maxX, cx); maxY = Math.max(maxY, cy);
        for (const [dx,dy] of dirs) {
          const nx = cx + dx; const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nidx = ny * width + nx;
          if (visited[nidx] || binary[nidx] === 0) continue;
          visited[nidx] = 1; q.push([nx, ny]);
        }
      }
      components.push({ area, minX, minY, maxX, maxY });
    }
  }
  return components;
}

export function detectDice(image: ImageData): DieCandidate[] {
  const gray = boxBlur(toGray(image), image.width, image.height, 2);
  const th = morphology(adaptiveThreshold(gray, image.width, image.height), image.width, image.height);
  const comps = connectedComponents(th, image.width, image.height);
  const minArea = (image.width * image.height) * 0.005;
  return comps
    .map((c) => {
      const width = c.maxX - c.minX + 1;
      const height = c.maxY - c.minY + 1;
      const areaBox = width * height;
      return {
        bbox: { x: c.minX, y: c.minY, width, height },
        area: c.area,
        aspectRatio: width / Math.max(1, height),
        extent: c.area / Math.max(1, areaBox)
      };
    })
    .filter((c) => c.area >= minArea && c.aspectRatio > 0.65 && c.aspectRatio < 1.35 && c.extent > 0.45)
    .sort((a, b) => b.area - a.area)
    .slice(0, 5);
}

export function normalizeDie(image: ImageData, candidate: DieCandidate): ImageData {
  const canvas = new OffscreenCanvas(DIE_SIZE, DIE_SIZE);
  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(DIE_SIZE, DIE_SIZE);
  const src = new OffscreenCanvas(image.width, image.height);
  const sctx = src.getContext("2d");
  if (!sctx) return new ImageData(DIE_SIZE, DIE_SIZE);
  sctx.putImageData(image, 0, 0);
  ctx.drawImage(src, candidate.bbox.x, candidate.bbox.y, candidate.bbox.width, candidate.bbox.height, 0, 0, DIE_SIZE, DIE_SIZE);
  return ctx.getImageData(0, 0, DIE_SIZE, DIE_SIZE);
}

export function detectPips(dieImage: ImageData): PipDetection[] {
  const gray = boxBlur(toGray(dieImage), dieImage.width, dieImage.height, 1);
  const thDark = morphology(adaptiveThreshold(gray, dieImage.width, dieImage.height, 17, 6), dieImage.width, dieImage.height);
  const thBright = morphology(adaptiveThreshold(new Uint8ClampedArray(gray.map((v) => 255 - v)), dieImage.width, dieImage.height, 17, 6), dieImage.width, dieImage.height);
  const collect = (mask: Uint8Array, bright: boolean) => connectedComponents(mask, dieImage.width, dieImage.height)
    .map((c) => {
      const w = c.maxX - c.minX + 1;
      const h = c.maxY - c.minY + 1;
      const cx = (c.minX + c.maxX) / 2;
      const cy = (c.minY + c.maxY) / 2;
      const radius = (w + h) / 4;
      const perimeter = Math.PI * (3 * (w + h) - Math.sqrt(Math.max(1, (3 * w + h) * (w + 3 * h))));
      const circularity = (4 * Math.PI * c.area) / Math.max(1, perimeter * perimeter);
      const contrast = Math.abs((gray[Math.floor(cy) * dieImage.width + Math.floor(cx)] ?? 0) - 128) / 128;
      return { x: cx, y: cy, radius, area: c.area, circularity, contrast, bright };
    })
    .filter((p) => {
      const areaMin = DIE_SIZE * DIE_SIZE * 0.002;
      const areaMax = DIE_SIZE * DIE_SIZE * 0.05;
      const border = DIE_SIZE * BORDER_MARGIN;
      return p.area >= areaMin && p.area <= areaMax && p.circularity > 0.45 && p.x > border && p.x < DIE_SIZE - border && p.y > border && p.y < DIE_SIZE - border;
    });

  const dark = collect(thDark, false);
  const bright = collect(thBright, true);
  const best = dark.length >= bright.length ? dark : bright;
  return best.slice(0, 8).map((pip) => ({ x: pip.x, y: pip.y, radius: pip.radius, area: pip.area, circularity: pip.circularity, contrast: pip.contrast }));
}

export function classifyDie(pips: PipDetection[]): DieClassification {
  const pipCount = pips.length;
  if (pipCount < 1 || pipCount > 6) {
    return { value: null, confidence: 0.2, isReliable: false, diagnostics: { pipCount, patternScore: 0 } };
  }
  const norm = pips.map((p) => ({ x: p.x / DIE_SIZE, y: p.y / DIE_SIZE }));
  const hasCenter = norm.some((p) => Math.abs(p.x - 0.5) < 0.15 && Math.abs(p.y - 0.5) < 0.15);
  const corners = norm.filter((p) => (p.x < 0.33 || p.x > 0.67) && (p.y < 0.33 || p.y > 0.67)).length;
  let patternScore = 0.5;
  if (pipCount === 1) patternScore = hasCenter ? 0.95 : 0.5;
  if (pipCount === 2) patternScore = corners >= 2 ? 0.85 : 0.55;
  if (pipCount === 3) patternScore = corners >= 2 && hasCenter ? 0.9 : 0.55;
  if (pipCount === 4) patternScore = corners >= 4 ? 0.92 : 0.65;
  if (pipCount === 5) patternScore = corners >= 4 && hasCenter ? 0.95 : 0.65;
  if (pipCount === 6) patternScore = corners >= 4 ? 0.85 : 0.6;
  const confidence = Math.max(0, Math.min(1, 0.55 + (patternScore - 0.5)));
  return { value: pipCount, confidence, isReliable: confidence >= 0.72, diagnostics: { pipCount, patternScore } };
}

export function scanDice(image: ImageData): DieDetection[] {
  const candidates = detectDice(image);
  const detections = candidates.map((candidate) => {
    const roi = normalizeDie(image, candidate);
    const pips = detectPips(roi);
    const classification = classifyDie(pips);
    return {
      value: classification.value,
      confidence: classification.confidence,
      isReliable: classification.isReliable,
      bbox: candidate.bbox,
      pips
    };
  });

  return detections.sort((a, b) => a.bbox.x - b.bbox.x || a.bbox.y - b.bbox.y);
}

export function debugDraw(ctx: CanvasRenderingContext2D, detections: DieDetection[]) {
  ctx.save();
  ctx.lineWidth = 2;
  detections.forEach((die) => {
    ctx.strokeStyle = die.isReliable ? "#10b981" : "#f59e0b";
    ctx.strokeRect(die.bbox.x, die.bbox.y, die.bbox.width, die.bbox.height);
    ctx.fillStyle = "rgba(15,23,42,0.8)";
    ctx.fillRect(die.bbox.x, Math.max(0, die.bbox.y - 18), 120, 18);
    ctx.fillStyle = "#fff";
    ctx.font = "12px sans-serif";
    ctx.fillText(`${die.value ?? "?"} (${Math.round(die.confidence * 100)}%)`, die.bbox.x + 4, Math.max(12, die.bbox.y - 5));
  });
  ctx.restore();
}
