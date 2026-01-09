/*
 * Canvas utilities providing high-performance graphics operations for fractal visualization and interactive mathematical rendering.
 * I'm implementing optimized canvas operations with proper pixel manipulation, coordinate transformations, and rendering pipelines for smooth real-time fractal exploration.
 */

interface CanvasConfig {
  width: number;
  height: number;
  pixelRatio?: number;
  alpha?: boolean;
  antialias?: boolean;
}

interface ColorPalette {
  name: string;
  colors: string[];
  interpolation: 'linear' | 'smooth' | 'stepped';
}

interface RenderingContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData;
  width: number;
  height: number;
  pixelRatio: number;
}

// I'm creating optimized canvas setup for high-DPI displays
export const createCanvas = (config: CanvasConfig): RenderingContext => {
  const {
    width,
    height,
    pixelRatio = window.devicePixelRatio || 1,
    alpha = false,
  } = config;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha })!;

  // I'm setting up high-DPI rendering
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingEnabled = false; // Sharp pixels for mathematical precision

  const imageData = ctx.createImageData(width, height);

  return {
    canvas,
    ctx,
    imageData,
    width,
    height,
    pixelRatio,
  };
};

// I'm implementing fast pixel manipulation for fractal data
export const setPixel = (
  imageData: ImageData,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  a: number = 255,
) => {
  const index = (y * imageData.width + x) * 4;
  imageData.data[index] = r; // Red
  imageData.data[index + 1] = g; // Green
  imageData.data[index + 2] = b; // Blue
  imageData.data[index + 3] = a; // Alpha
};

// I'm creating efficient batch pixel operations
export const setPixelBatch = (
  imageData: ImageData,
  pixels: Array<{
    x: number;
    y: number;
    color: [number, number, number, number];
  }>,
) => {
  for (const pixel of pixels) {
    setPixel(imageData, pixel.x, pixel.y, ...pixel.color);
  }
};

// I'm implementing fractal-specific color palettes
export const fractalPalettes: ColorPalette[] = [
  {
    name: 'Eerie Dark',
    colors: ['#000000', '#0a0a0a', '#1a1a2e', '#16213e', '#0f3460'],
    interpolation: 'smooth',
  },
  {
    name: 'Cyber Glow',
    colors: ['#000000', '#001122', '#003366', '#0066cc', '#22d3ee'],
    interpolation: 'smooth',
  },
  {
    name: 'Void Purple',
    colors: ['#000000', '#0d0815', '#1a0f2e', '#2e1065', '#6366f1'],
    interpolation: 'smooth',
  },
  {
    name: 'Matrix Green',
    colors: ['#000000', '#001100', '#003300', '#00ff00', '#66ff66'],
    interpolation: 'linear',
  },
  {
    name: 'Rust Orange',
    colors: ['#000000', '#2d1b0e', '#5d3a1a', '#cc6600', '#ff9900'],
    interpolation: 'smooth',
  },
];

// I'm creating smooth color interpolation for iteration mapping
export const interpolateColor = (
  color1: [number, number, number],
  color2: [number, number, number],
  factor: number,
): [number, number, number] => {
  const [r1, g1, b1] = color1;
  const [r2, g2, b2] = color2;

  return [
    Math.round(r1 + (r2 - r1) * factor),
    Math.round(g1 + (g2 - g1) * factor),
    Math.round(b1 + (b2 - b1) * factor),
  ];
};

// I'm implementing palette-based coloring for fractal iterations
export const getColorFromPalette = (
  iterations: number,
  maxIterations: number,
  palette: ColorPalette,
): [number, number, number, number] => {
  if (iterations === maxIterations) {
    return [0, 0, 0, 255]; // Black for points in the set
  }

  const normalizedIterations = iterations / maxIterations;
  const colorCount = palette.colors.length;

  if (palette.interpolation === 'stepped') {
    const colorIndex = Math.floor(normalizedIterations * (colorCount - 1));
    const color = hexToRgb(palette.colors[colorIndex]);
    return [...color, 255] as [number, number, number, number];
  }

  // Smooth interpolation between colors
  const position = normalizedIterations * (colorCount - 1);
  const colorIndex = Math.floor(position);
  const factor = position - colorIndex;

  const color1 = hexToRgb(
    palette.colors[Math.min(colorIndex, colorCount - 1)],
  );
  const color2 = hexToRgb(
    palette.colors[Math.min(colorIndex + 1, colorCount - 1)],
  );

  const interpolated = interpolateColor(color1, color2, factor);
  return [...interpolated, 255] as [number, number, number, number];
};

// I'm implementing coordinate transformations for fractal navigation
export const screenToComplex = (
  screenX: number,
  screenY: number,
  width: number,
  height: number,
  centerReal: number,
  centerImag: number,
  zoom: number,
): { real: number; imag: number } => {
  const scale = 4.0 / zoom;
  const real = centerReal + ((screenX - width / 2) * scale) / width;
  const imag = centerImag + ((screenY - height / 2) * scale) / height;

  return { real, imag };
};

// I'm implementing reverse coordinate transformation
export const complexToScreen = (
  real: number,
  imag: number,
  width: number,
  height: number,
  centerReal: number,
  centerImag: number,
  zoom: number,
): { x: number; y: number } => {
  const scale = 4.0 / zoom;
  const x = ((real - centerReal) * width) / scale + width / 2;
  const y = ((imag - centerImag) * height) / scale + height / 2;

  return { x, y };
};

// I'm creating efficient fractal rendering from backend data
export const renderFractalData = (
  ctx: RenderingContext,
  fractalData: number[],
  width: number,
  height: number,
  palette: ColorPalette = fractalPalettes[0],
) => {
  const { imageData } = ctx;

  // I'm finding the max iteration count for normalization
  const maxIterations = Math.max(...fractalData);

  for (let i = 0; i < fractalData.length; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    const iterations = fractalData[i];

    const color = getColorFromPalette(iterations, maxIterations, palette);
    setPixel(imageData, x, y, ...color);
  }

  ctx.ctx.putImageData(imageData, 0, 0);
};

// I'm implementing smooth zoom animations for fractal exploration
export const animateZoom = (
  ctx: RenderingContext,
  startZoom: number,
  endZoom: number,
  duration: number,
  onUpdate: (zoom: number) => void,
): Promise<void> => {
  return new Promise((resolve) => {
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // I'm using smooth easing for natural zoom feel
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentZoom = startZoom + (endZoom - startZoom) * easeProgress;

      onUpdate(currentZoom);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(animate);
  });
};

// I'm creating performance optimization utilities
export const canvasOptimizations = {
  // Double buffering for smooth updates
  createDoubleBuffer: (width: number, height: number) => {
    const frontBuffer = createCanvas({ width, height });
    const backBuffer = createCanvas({ width, height });

    return {
      front: frontBuffer,
      back: backBuffer,
      swap: () => {
        frontBuffer.ctx.drawImage(backBuffer.canvas, 0, 0);
      },
    };
  },

  // Dirty rectangle tracking for partial updates
  createDirtyRegion: () => {
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    return {
      markDirty: (x: number, y: number, width: number, height: number) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      },

      getDirtyRect: () => ({
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      }),

      clear: () => {
        minX = minY = Infinity;
        maxX = maxY = -Infinity;
      },
    };
  },

  // WebGL context for GPU acceleration (when available)
  createWebGLContext: (canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) {
      console.warn('WebGL not supported, falling back to 2D canvas');
      return null;
    }

    // I'm setting up basic WebGL state
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    return gl;
  },
};

// I'm implementing drawing utilities for UI overlays
export const drawingUtils = {
  // Performance metrics overlay
  drawMetricsOverlay: (
    ctx: CanvasRenderingContext2D,
    metrics: {
      computationTime: number;
      renderTime: number;
      totalPixels: number;
      zoom: number;
    },
  ) => {
    const padding = 10;
    const lineHeight = 16;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(padding, padding, 200, 80);

    ctx.fillStyle = '#22d3ee';
    ctx.font = '12px monospace';
    ctx.fillText(
      `Computation: ${metrics.computationTime}ms`,
      padding + 5,
      padding + lineHeight,
    );
    ctx.fillText(
      `Render: ${metrics.renderTime}ms`,
      padding + 5,
      padding + lineHeight * 2,
    );
    ctx.fillText(
      `Pixels: ${metrics.totalPixels.toLocaleString()}`,
      padding + 5,
      padding + lineHeight * 3,
    );
    ctx.fillText(
      `Zoom: ${metrics.zoom.toExponential(2)}`,
      padding + 5,
      padding + lineHeight * 4,
    );
    ctx.restore();
  },

  // Crosshair for precise navigation
  drawCrosshair: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number = 20,
  ) => {
    ctx.save();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();
    ctx.restore();
  },

  // Selection rectangle for zoom regions
  drawSelectionRect: (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ) => {
    ctx.save();
    ctx.strokeStyle = '#22d3ee';
    ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
    ctx.lineWidth = 2;

    const width = endX - startX;
    const height = endY - startY;

    ctx.fillRect(startX, startY, width, height);
    ctx.strokeRect(startX, startY, width, height);
    ctx.restore();
  },
};

// I'm providing utility functions for color manipulation
export const colorUtils = {
  hexToRgb: (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0];
  },

  rgbToHex: (r: number, g: number, b: number): string => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  },

  hslToRgb: (h: number, s: number, l: number): [number, number, number] => {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return [
      Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      Math.round(hue2rgb(p, q, h) * 255),
      Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    ];
  },
};

// I'm re-exporting the hexToRgb function for backward compatibility
export const hexToRgb = colorUtils.hexToRgb;

// I'm creating image export utilities
export const exportUtils = {
  canvasToBlob: (
    canvas: HTMLCanvasElement,
    quality: number = 0.9,
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob!);
        },
        'image/png',
        quality,
      );
    });
  },

  downloadCanvas: async (
    canvas: HTMLCanvasElement,
    filename: string = 'fractal.png',
  ) => {
    const blob = await exportUtils.canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  },

  canvasToDataURL: (
    canvas: HTMLCanvasElement,
    format: string = 'image/png',
  ): string => {
    return canvas.toDataURL(format);
  },
};
