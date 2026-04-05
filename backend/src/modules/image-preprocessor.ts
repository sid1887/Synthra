/**
 * A3: Image Input Module
 * Upload validation, preprocessing, compression, quality assessment
 */

import sharp from 'sharp';
import { ImageQuality, ImagePayload } from '../types/schemas.js';

export interface ImagePreprocessConfig {
  maxSizeBytes: number;
  maxDimension: number;
  quality: number;
}

const DEFAULT_CONFIG: ImagePreprocessConfig = {
  maxSizeBytes: 10 * 1024 * 1024, // 10 MB
  maxDimension: 1600,
  quality: 85,
};

/**
 * Validate file before processing
 */
export function validateImageFile(
  buffer: Buffer,
  filename: string,
  config: ImagePreprocessConfig = DEFAULT_CONFIG,
): { valid: boolean; error?: string } {
  // Check size
  if (buffer.length > config.maxSizeBytes) {
    return { valid: false, error: `File too large: ${buffer.length} > ${config.maxSizeBytes}` };
  }

  // Check extension
  const ext = filename.split('.').pop()?.toLowerCase();
  const allowedExt = ['jpg', 'jpeg', 'png', 'webp'];
  if (!allowedExt.includes(ext || '')) {
    return { valid: false, error: `Unsupported format: .${ext}` };
  }

  // Check magic bytes
  const magicBytes = {
    jpg: [0xff, 0xd8, 0xff],
    png: [0x89, 0x50, 0x4e, 0x47],
    webp: [0x52, 0x49, 0x46, 0x46],
    gif: [0x47, 0x49, 0x46],
  };

  let recognized = false;
  for (const [, bytes] of Object.entries(magicBytes)) {
    if (bytes.every((b, i) => buffer[i] === b)) {
      recognized = true;
      break;
    }
  }

  if (!recognized) {
    return { valid: false, error: 'File signature does not match image format' };
  }

  return { valid: true };
}

/**
 * Detect basic image quality issues
 */
async function assessQuality(image: sharp.Sharp, metadata: any): Promise<ImageQuality> {
  // Get image stats for blur/brightness detection
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  let darkPixels = 0;
  let edgePixels = 0;

  const pixelSize = info.channels;
  for (let i = 0; i < data.length; i += pixelSize) {
    const r = data[i];
    const g = data[i + 1] || r;
    const b = data[i + 2] || r;
    const brightness = (r + g + b) / 3;

    // Count dark pixels
    if (brightness < 50) darkPixels++;
  }

  const darkRatio = darkPixels / (data.length / pixelSize);

  return {
    dark: darkRatio > 0.5,
    blurry: false, // would require Laplacian variance test
    anglePoor: false, // would require perspective/OCR analysis
  };
}

/**
 * Preprocess and optimize image
 */
export async function preprocessImage(
  buffer: Buffer,
  filename: string,
  config: ImagePreprocessConfig = DEFAULT_CONFIG,
): Promise<{ buffer: Buffer; metadata: ImagePayload }> {
  // Validate first
  const validation = validateImageFile(buffer, filename, config);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image file');
  }

  const imageId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  let image = sharp(buffer, { failOnError: true });

  // Get metadata
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Could not determine image dimensions');
  }

  // Detect orientation from EXIF
  let originalWidth = metadata.width;
  let originalHeight = metadata.height;
  if (metadata.orientation === 6 || metadata.orientation === 8) {
    // Rotated 90 or 270 degrees
    [originalWidth, originalHeight] = [originalHeight, originalWidth];
  }

  // Auto-rotate based on EXIF
  image = image.withMetadata({ orientation: 1 });

  // Scale down if too large
  if (originalWidth > config.maxDimension || originalHeight > config.maxDimension) {
    image = image.resize(config.maxDimension, config.maxDimension, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Compress to WebP
  const compressed = await image.webp({ quality: config.quality }).toBuffer();

  // Re-read metadata after transformation
  const finalMetadata = await sharp(compressed).metadata();

  // Assess quality
  const quality = await assessQuality(sharp(buffer), metadata);

  return {
    buffer: compressed,
    metadata: {
      imageId,
      width: finalMetadata.width || originalWidth,
      height: finalMetadata.height || originalHeight,
      quality,
      mimeType: 'image/webp',
      fileSizeBytes: compressed.length,
    },
  };
}

/**
 * Extract basic metadata without full preprocessing (for validation)
 */
export async function getImageMetadata(
  buffer: Buffer,
): Promise<{ width: number; height: number; format: string }> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
  };
}

/**
 * Generate thumbnail for UI preview
 */
export async function generateThumbnail(buffer: Buffer, size: number = 200): Promise<Buffer> {
  return sharp(buffer)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .webp({ quality: 80 })
    .toBuffer();
}
