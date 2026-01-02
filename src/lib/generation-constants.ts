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
