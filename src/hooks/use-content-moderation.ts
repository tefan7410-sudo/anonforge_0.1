import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ModerationResult {
  isSafe: boolean;
  flaggedCategories: string[];
  confidence: number;
  message?: string;
}

interface ModerateImageParams {
  imageUrl?: string;
  imageBase64?: string;
}

interface ModerateTextParams {
  text: string;
  context?: string;
}

/**
 * Hook to moderate images for inappropriate content
 */
export function useModerateImage() {
  return useMutation({
    mutationFn: async ({ imageUrl, imageBase64 }: ModerateImageParams): Promise<ModerationResult> => {
      const { data, error } = await supabase.functions.invoke('content-moderation', {
        body: { 
          type: 'image',
          imageUrl,
          imageBase64,
        },
      });

      if (error) {
        console.error('Moderation error:', error);
        // If moderation fails, allow the upload but log the error
        return { isSafe: true, flaggedCategories: [], confidence: 0, message: 'Moderation unavailable' };
      }

      return data;
    },
  });
}

/**
 * Hook to moderate text content for inappropriate content
 */
export function useModerateText() {
  return useMutation({
    mutationFn: async ({ text, context }: ModerateTextParams): Promise<ModerationResult> => {
      if (!text || text.trim().length === 0) {
        return { isSafe: true, flaggedCategories: [], confidence: 1 };
      }

      const { data, error } = await supabase.functions.invoke('content-moderation', {
        body: { 
          type: 'text',
          text,
          context,
        },
      });

      if (error) {
        console.error('Text moderation error:', error);
        // If moderation fails, allow the content but log the error
        return { isSafe: true, flaggedCategories: [], confidence: 0, message: 'Moderation unavailable' };
      }

      return data;
    },
  });
}

/**
 * Helper to convert a File to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}
