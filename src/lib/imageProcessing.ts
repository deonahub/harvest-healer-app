// Client-side image processing pipeline using Canvas 2D.
// Implements: resize, grayscale, Gaussian blur, Laplacian variance (blur detection),
// CLAHE-like contrast enhancement + sharpening, Canny-style edge detection,
// damage highlight overlay, JET-colormap heatmap, and bounding-box drawing.

export interface ProcessedPipeline {
  original: string;       // data URL of resized original
  grayscale: string;
  enhanced: string;
  edges: string;
  heatmap: string;
  damageHighlight: string; // damage overlay (filled later with detection)
  blurScore: number;       // Laplacian variance
  isBlurry: boolean;
  width: number;
  height: number;
}

const TARGET_W = 640;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// Resize image keeping aspect ratio.
function resizeImage(img: HTMLImageElement) {
  const ratio = img.height / img.width;
  const w = Math.min(TARGET_W, img.width);
  const h = Math.round(w * ratio);
  const c = makeCanvas(w, h);
  c.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return c;
}

function toGray(src: HTMLCanvasElement): { canvas: HTMLCanvasElement; gray: Uint8ClampedArray } {
  const { width, height } = src;
  const ctx = src.getContext("2d")!;
  const data = ctx.getImageData(0, 0, width, height);
  const out = makeCanvas(width, height);
  const outCtx = out.getContext("2d")!;
  const outImg = outCtx.createImageData(width, height);
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0; i < data.data.length; i += 4, j++) {
    const v = (data.data[i] * 0.299 + data.data[i + 1] * 0.587 + data.data[i + 2] * 0.114) | 0;
    gray[j] = v;
    outImg.data[i] = outImg.data[i + 1] = outImg.data[i + 2] = v;
    outImg.data[i + 3] = 255;
  }
  outCtx.putImageData(outImg, 0, 0);
  return { canvas: out, gray };
}

// Approximate Gaussian blur using built-in canvas filter (fast).
function gaussianBlur(src: HTMLCanvasElement, radius = 2): HTMLCanvasElement {
  const out = makeCanvas(src.width, src.height);
  const ctx = out.getContext("2d")!;
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(src, 0, 0);
  ctx.filter = "none";
  return out;
}

// Laplacian variance for blur detection. Lower = blurrier.
function laplacianVariance(gray: Uint8ClampedArray, w: number, h: number): number {
  const lap = new Float32Array(w * h);
  let mean = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v =
        -gray[i - w] -
        gray[i - 1] +
        4 * gray[i] -
        gray[i + 1] -
        gray[i + w];
      lap[i] = v;
      mean += v;
    }
  }
  const n = (w - 2) * (h - 2);
  mean /= n;
  let variance = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const d = lap[y * w + x] - mean;
      variance += d * d;
    }
  }
  return variance / n;
}

// CLAHE-like contrast enhancement (global histogram equalization on luminance) + sharpening.
function enhance(src: HTMLCanvasElement): HTMLCanvasElement {
  const { width, height } = src;
  const ctx = src.getContext("2d")!;
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;

  // Build luminance histogram
  const hist = new Uint32Array(256);
  const lum = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const y = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
    lum[j] = y;
    hist[y]++;
  }
  // Clip histogram (CLAHE-style clip)
  const clip = (width * height) / 256 * 3;
  let excess = 0;
  for (let i = 0; i < 256; i++) {
    if (hist[i] > clip) {
      excess += hist[i] - clip;
      hist[i] = clip;
    }
  }
  const add = excess / 256;
  for (let i = 0; i < 256; i++) hist[i] += add;
  // CDF
  const cdf = new Uint32Array(256);
  cdf[0] = hist[0];
  for (let i = 1; i < 256; i++) cdf[i] = cdf[i - 1] + hist[i];
  const cdfMin = cdf.find((v) => v > 0) || 0;
  const total = width * height;
  const map = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) {
    map[i] = Math.round(((cdf[i] - cdfMin) / (total - cdfMin)) * 255);
  }
  // Apply mapping per channel preserving color via ratio
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const y = lum[j];
    const ny = map[y];
    const ratio = y === 0 ? 1 : ny / y;
    d[i] = Math.min(255, d[i] * ratio);
    d[i + 1] = Math.min(255, d[i + 1] * ratio);
    d[i + 2] = Math.min(255, d[i + 2] * ratio);
  }
  const equalized = makeCanvas(width, height);
  equalized.getContext("2d")!.putImageData(img, 0, 0);

  // Sharpening via unsharp mask: original + (original - blurred)
  const blurred = gaussianBlur(equalized, 1.5);
  const out = makeCanvas(width, height);
  const octx = out.getContext("2d")!;
  octx.drawImage(equalized, 0, 0);
  const orig = octx.getImageData(0, 0, width, height);
  const bd = blurred.getContext("2d")!.getImageData(0, 0, width, height).data;
  const od = orig.data;
  const amount = 0.6;
  for (let i = 0; i < od.length; i += 4) {
    od[i] = Math.max(0, Math.min(255, od[i] + (od[i] - bd[i]) * amount));
    od[i + 1] = Math.max(0, Math.min(255, od[i + 1] + (od[i + 1] - bd[i + 1]) * amount));
    od[i + 2] = Math.max(0, Math.min(255, od[i + 2] + (od[i + 2] - bd[i + 2]) * amount));
  }
  octx.putImageData(orig, 0, 0);
  return out;
}

// Sobel-based edge detection (Canny-style result, simpler implementation).
function detectEdges(grayCanvas: HTMLCanvasElement): { canvas: HTMLCanvasElement; magnitude: Float32Array } {
  const { width: w, height: h } = grayCanvas;
  const ctx = grayCanvas.getContext("2d")!;
  const data = ctx.getImageData(0, 0, w, h).data;
  const gray = new Uint8ClampedArray(w * h);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) gray[j] = data[i];

  const mag = new Float32Array(w * h);
  let max = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx =
        -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] +
        gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
      const gy =
        -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] +
        gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
      const m = Math.sqrt(gx * gx + gy * gy);
      mag[i] = m;
      if (m > max) max = m;
    }
  }
  const out = makeCanvas(w, h);
  const octx = out.getContext("2d")!;
  const oimg = octx.createImageData(w, h);
  const threshold = max * 0.18;
  for (let i = 0; i < mag.length; i++) {
    const v = mag[i] > threshold ? 255 : 0;
    oimg.data[i * 4] = v;
    oimg.data[i * 4 + 1] = v;
    oimg.data[i * 4 + 2] = v;
    oimg.data[i * 4 + 3] = 255;
  }
  octx.putImageData(oimg, 0, 0);
  return { canvas: out, magnitude: mag };
}

// JET colormap value -> [r,g,b]
function jetColor(v: number): [number, number, number] {
  // v in [0,1]
  const fourV = 4 * v;
  const r = Math.max(0, Math.min(1, Math.min(fourV - 1.5, -fourV + 4.5)));
  const g = Math.max(0, Math.min(1, Math.min(fourV - 0.5, -fourV + 3.5)));
  const b = Math.max(0, Math.min(1, Math.min(fourV + 0.5, -fourV + 2.5)));
  return [(r * 255) | 0, (g * 255) | 0, (b * 255) | 0];
}

// Build heatmap from edge magnitude (smoothed) overlaid on the original.
function buildHeatmap(original: HTMLCanvasElement, magnitude: Float32Array): HTMLCanvasElement {
  const { width: w, height: h } = original;
  // Smooth magnitude by box-blur (downsample then upsample via canvas)
  const heat = makeCanvas(w, h);
  const hctx = heat.getContext("2d")!;
  const himg = hctx.createImageData(w, h);
  let max = 0;
  for (let i = 0; i < magnitude.length; i++) if (magnitude[i] > max) max = magnitude[i];
  if (max === 0) max = 1;
  for (let i = 0; i < magnitude.length; i++) {
    const v = magnitude[i] / max;
    const [r, g, b] = jetColor(v);
    himg.data[i * 4] = r;
    himg.data[i * 4 + 1] = g;
    himg.data[i * 4 + 2] = b;
    himg.data[i * 4 + 3] = 255;
  }
  hctx.putImageData(himg, 0, 0);
  // Smooth the heatmap
  const smooth = gaussianBlur(heat, 6);

  const out = makeCanvas(w, h);
  const octx = out.getContext("2d")!;
  octx.drawImage(original, 0, 0);
  octx.globalAlpha = 0.55;
  octx.drawImage(smooth, 0, 0);
  octx.globalAlpha = 1;
  return out;
}

// Damage highlight: red translucent overlay on regions with high edge density.
// Returns canvas + estimated damage percent + bounding boxes for clusters.
export interface DamageOverlayResult {
  canvas: HTMLCanvasElement;
  damagePercent: number;
  boxes: Array<{ x: number; y: number; w: number; h: number }>;
}

function buildDamageOverlay(
  original: HTMLCanvasElement,
  magnitude: Float32Array,
  damageType: string
): DamageOverlayResult {
  const { width: w, height: h } = original;
  // Block-based damage scoring (16x16 blocks)
  const bs = 16;
  const cols = Math.ceil(w / bs);
  const rows = Math.ceil(h / bs);
  const scores = new Float32Array(cols * rows);
  let max = 0;
  for (let i = 0; i < magnitude.length; i++) if (magnitude[i] > max) max = magnitude[i];
  if (max === 0) max = 1;
  for (let y = 0; y < h; y++) {
    const by = (y / bs) | 0;
    for (let x = 0; x < w; x++) {
      const bx = (x / bs) | 0;
      scores[by * cols + bx] += magnitude[y * w + x] / max;
    }
  }
  // Normalise per block
  const blockArea = bs * bs;
  let damagedBlocks = 0;
  const damagedFlags = new Uint8Array(cols * rows);
  const threshold = damageType === "safe" ? 0.55 : 0.32;
  for (let i = 0; i < scores.length; i++) {
    scores[i] /= blockArea;
    if (scores[i] > threshold) {
      damagedFlags[i] = 1;
      damagedBlocks++;
    }
  }

  const out = makeCanvas(w, h);
  const ctx = out.getContext("2d")!;
  ctx.drawImage(original, 0, 0);

  if (damageType !== "safe") {
    ctx.fillStyle = "rgba(220, 38, 38, 0.38)";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (damagedFlags[r * cols + c]) {
          ctx.fillRect(c * bs, r * bs, bs, bs);
        }
      }
    }
  }

  // Connected-components on damaged blocks → bounding boxes
  const visited = new Uint8Array(cols * rows);
  const boxes: Array<{ x: number; y: number; w: number; h: number }> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (!damagedFlags[idx] || visited[idx]) continue;
      // BFS
      let minR = r, maxR = r, minC = c, maxC = c, count = 0;
      const stack = [idx];
      visited[idx] = 1;
      while (stack.length) {
        const k = stack.pop()!;
        const kr = (k / cols) | 0;
        const kc = k % cols;
        if (kr < minR) minR = kr;
        if (kr > maxR) maxR = kr;
        if (kc < minC) minC = kc;
        if (kc > maxC) maxC = kc;
        count++;
        const neigh = [k - 1, k + 1, k - cols, k + cols];
        for (const n of neigh) {
          if (n < 0 || n >= cols * rows) continue;
          if (Math.abs((n % cols) - kc) > 1 && (n === k - 1 || n === k + 1)) continue;
          if (damagedFlags[n] && !visited[n]) {
            visited[n] = 1;
            stack.push(n);
          }
        }
      }
      if (count >= 6) {
        boxes.push({
          x: minC * bs,
          y: minR * bs,
          w: (maxC - minC + 1) * bs,
          h: (maxR - minR + 1) * bs,
        });
      }
    }
  }

  // Draw bounding boxes (animal detection visualization)
  if (damageType !== "safe") {
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 200, 0, 0.95)";
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "rgba(255, 200, 0, 0.95)";
    boxes.slice(0, 5).forEach((b, i) => {
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      const label = damageType === "animal_damage" ? "Animal" : damageType === "crop_lodging" ? "Lodging" : "Damage";
      ctx.fillRect(b.x, Math.max(0, b.y - 18), ctx.measureText(label).width + 10, 18);
      ctx.fillStyle = "#000";
      ctx.fillText(label, b.x + 5, Math.max(12, b.y - 5));
      ctx.fillStyle = "rgba(255, 200, 0, 0.95)";
    });
  }

  const damagePercent = Math.round((damagedBlocks / scores.length) * 1000) / 10;
  return { canvas: out, damagePercent, boxes };
}

export async function runPipeline(srcDataUrl: string): Promise<ProcessedPipeline> {
  const img = await loadImage(srcDataUrl);
  const resized = resizeImage(img);
  const original = resized;

  // Grayscale
  const grayResult = toGray(original);
  // Noise reduction
  const denoised = gaussianBlur(grayResult.canvas, 1.2);
  // Blur detection on denoised gray
  const denoisedData = denoised.getContext("2d")!.getImageData(0, 0, denoised.width, denoised.height).data;
  const denoisedGray = new Uint8ClampedArray(denoised.width * denoised.height);
  for (let i = 0, j = 0; i < denoisedData.length; i += 4, j++) denoisedGray[j] = denoisedData[i];
  const blurScore = laplacianVariance(denoisedGray, denoised.width, denoised.height);
  const isBlurry = blurScore < 100;

  // Enhance (always — improves quality)
  const enhanced = enhance(original);

  // Edges from enhanced+gray
  const enhancedGray = toGray(enhanced).canvas;
  const edgeResult = detectEdges(enhancedGray);

  // Heatmap on original
  const heatmap = buildHeatmap(original, edgeResult.magnitude);

  return {
    original: original.toDataURL("image/jpeg", 0.9),
    grayscale: grayResult.canvas.toDataURL("image/jpeg", 0.9),
    enhanced: enhanced.toDataURL("image/jpeg", 0.9),
    edges: edgeResult.canvas.toDataURL("image/jpeg", 0.9),
    heatmap: heatmap.toDataURL("image/jpeg", 0.9),
    damageHighlight: original.toDataURL("image/jpeg", 0.9), // placeholder, fill later
    blurScore: Math.round(blurScore * 10) / 10,
    isBlurry,
    width: original.width,
    height: original.height,
  };
}

// Build damage overlay separately so we can use the AI damageType from the analysis result.
export async function buildDamageView(
  srcDataUrl: string,
  damageType: string
): Promise<{ dataUrl: string; damagePercent: number; boxCount: number }> {
  const img = await loadImage(srcDataUrl);
  const resized = resizeImage(img);
  const grayResult = toGray(resized);
  const denoised = gaussianBlur(grayResult.canvas, 1.2);
  const enhancedGray = toGray(enhance(resized)).canvas;
  const edge = detectEdges(enhancedGray);
  const overlay = buildDamageOverlay(resized, edge.magnitude, damageType);
  return {
    dataUrl: overlay.canvas.toDataURL("image/jpeg", 0.9),
    damagePercent: overlay.damagePercent,
    boxCount: overlay.boxes.length,
  };
}
