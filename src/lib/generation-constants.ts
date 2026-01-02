// Generation configuration constants
export const GENERATION_CONFIG = {
  // Resolution limits
  MAX_LAYER_RESOLUTION: 3000,
  MAX_EXPORT_RESOLUTION: 3000,
  PREVIEW_RESOLUTION: 384, // Reduced from 512 for faster previews
  
  // Export settings
  EXPORT_FORMAT: 'image/jpeg' as const,
  EXPORT_QUALITY: 0.92, // High quality JPG (0.0 - 1.0)
  EXPORT_EXTENSION: 'jpg' as const,
  
  // Performance settings
  BATCH_CHUNK_SIZE: 10, // Process in chunks to prevent memory issues
};

// Calculate actual byte size from base64 string
export function calculateBase64Size(base64String: string): number {
  // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
  const base64Data = base64String.split(',')[1] || base64String;
  // Base64 is ~33% larger than binary, so we divide by 1.33 (multiply by 0.75)
  return Math.round(base64Data.length * 0.75);
}

// Format bytes into human-readable string
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
