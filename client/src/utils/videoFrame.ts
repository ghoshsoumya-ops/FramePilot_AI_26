export interface FrameLuminanceResult {
  averageLuminance: number; // 0 to 255
  classification: 'LOW_LIGHT' | 'ACCEPTABLE' | 'OVEREXPOSURE';
}

export interface FramingEvaluation {
  status: 'OPTIMAL' | 'FACE_MISSING' | 'FACE_OFF_CENTER' | 'FACE_TOO_CLOSE' | 'FACE_TOO_FAR' | 'FACE_TOO_HIGH' | 'FACE_TOO_LOW';
  message: string;
}

/**
 * Captures downscaled JPEG base64 string from a video element (max width 512px)
 */
export function captureDownscaledFrame(
  videoElement: HTMLVideoElement,
  maxWidth: number = 512,
  quality: number = 0.7
): string | null {
  if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    return null;
  }

  const canvas = document.createElement('canvas');
  let width = videoElement.videoWidth;
  let height = videoElement.videoHeight;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(videoElement, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Calculates average luminance across sampled pixels
 * Standard perceived brightness formula: Y = 0.299*R + 0.587*G + 0.114*B
 */
export function calculateLuminance(imageData: ImageData): FrameLuminanceResult {
  const data = imageData.data;
  let sumLuminance = 0;
  const totalPixels = imageData.width * imageData.height;

  // Sample every 4th pixel for high speed
  const step = 4;
  let sampledCount = 0;

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    sumLuminance += lum;
    sampledCount++;
  }

  const avgLum = sampledCount > 0 ? sumLuminance / sampledCount : 128;

  let classification: 'LOW_LIGHT' | 'ACCEPTABLE' | 'OVEREXPOSURE' = 'ACCEPTABLE';
  if (avgLum < 55) {
    classification = 'LOW_LIGHT';
  } else if (avgLum > 205) {
    classification = 'OVEREXPOSURE';
  }

  return {
    averageLuminance: Math.round(avgLum),
    classification
  };
}

/**
 * Estimates image sharpness using Laplacian variance approximation
 * Lower score = blurrier image
 */
export function estimateLaplacianBlur(imageData: ImageData): number {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // Convert to grayscale grid
  const gray = new Float32Array(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // 3x3 Laplacian Kernel:
  // [  0,  1,  0 ]
  // [  1, -4,  1 ]
  // [  0,  1,  0 ]
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  // Skip 2 pixels around borders and step by 2 for real-time performance
  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x += 2) {
      const idx = y * width + x;
      const lap =
        gray[idx - width] +
        gray[idx + width] +
        gray[idx - 1] +
        gray[idx + 1] -
        4 * gray[idx];

      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  if (count === 0) return 100;
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return Math.round(variance);
}

/**
 * Evaluates face bounding box relative to video frame dimensions
 * box: { xCenter, yCenter, width, height } normalized 0 to 1
 */
export function evaluateFaceFraming(
  box: { xCenter: number; yCenter: number; width: number; height: number } | null
): FramingEvaluation {
  if (!box) {
    return {
      status: 'FACE_MISSING',
      message: 'No face detected in camera frame.'
    };
  }

  // Size checks
  if (box.height > 0.65 || box.width > 0.65) {
    return {
      status: 'FACE_TOO_CLOSE',
      message: 'Camera too close. Step back slightly for natural headroom.'
    };
  }
  if (box.height < 0.12 || box.width < 0.12) {
    return {
      status: 'FACE_TOO_FAR',
      message: 'You are framed too far back. Move closer to the lens.'
    };
  }

  // Centering checks (xCenter should be between 0.35 and 0.65)
  if (box.xCenter < 0.32 || box.xCenter > 0.68) {
    return {
      status: 'FACE_OFF_CENTER',
      message: 'Re-center your position in the camera frame.'
    };
  }

  // Headroom check (yCenter should ideally be around 0.30 - 0.50)
  if (box.yCenter < 0.20) {
    return {
      status: 'FACE_TOO_HIGH',
      message: 'Too close to the top edge. Tilt camera up or lower your seat.'
    };
  }
  if (box.yCenter > 0.65) {
    return {
      status: 'FACE_TOO_LOW',
      message: 'Sitting too low in the frame. Raise camera angle.'
    };
  }

  return {
    status: 'OPTIMAL',
    message: 'Optimal eye-level framing.'
  };
}

