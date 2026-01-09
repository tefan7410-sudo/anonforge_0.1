/**
 * Image validation utility for consistent size/dimension/format checks across the app
 */

export interface ImageLimits {
  maxSizeMB: number;
  maxDimension: number;
  minDimension?: number;
}

export const IMAGE_LIMITS: Record<string, ImageLimits> = {
  avatar: { maxSizeMB: 5, maxDimension: 2000, minDimension: 50 },
  banner: { maxSizeMB: 10, maxDimension: 4000, minDimension: 400 },
  logo: { maxSizeMB: 5, maxDimension: 1000, minDimension: 50 },
  layer: { maxSizeMB: 20, maxDimension: 3000, minDimension: 100 },
  portfolio: { maxSizeMB: 10, maxDimension: 3000, minDimension: 100 },
  founder: { maxSizeMB: 5, maxDimension: 2000, minDimension: 50 },
  preview: { maxSizeMB: 10, maxDimension: 3000, minDimension: 200 },
  artwork: { maxSizeMB: 15, maxDimension: 4000, minDimension: 200 },
};

export const SUPPORTED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
export const SUPPORTED_FORMATS_DISPLAY = 'PNG, JPG, JPEG, WebP';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  width?: number;
  height?: number;
  sizeMB?: number;
}

/**
 * Get image dimensions from a file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Validate an image file against specified limits
 */
export async function validateImageUpload(
  file: File,
  type: keyof typeof IMAGE_LIMITS
): Promise<ValidationResult> {
  const limits = IMAGE_LIMITS[type];
  if (!limits) {
    return { isValid: false, error: `Unknown image type: ${type}` };
  }

  // Check file format
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid format. Supported: ${SUPPORTED_FORMATS_DISPLAY}`,
    };
  }

  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > limits.maxSizeMB) {
    return {
      isValid: false,
      error: `File too large (${sizeMB.toFixed(1)}MB). Max: ${limits.maxSizeMB}MB`,
      sizeMB,
    };
  }

  // Check dimensions
  try {
    const { width, height } = await getImageDimensions(file);

    if (width > limits.maxDimension || height > limits.maxDimension) {
      return {
        isValid: false,
        error: `Image too large (${width}x${height}). Max: ${limits.maxDimension}x${limits.maxDimension}`,
        width,
        height,
        sizeMB,
      };
    }

    if (limits.minDimension && (width < limits.minDimension || height < limits.minDimension)) {
      return {
        isValid: false,
        error: `Image too small (${width}x${height}). Min: ${limits.minDimension}x${limits.minDimension}`,
        width,
        height,
        sizeMB,
      };
    }

    return { isValid: true, width, height, sizeMB };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to read image dimensions',
    };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
