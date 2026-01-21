/**
 * DEPRECATED: Supabase types have been replaced with Convex schema.
 * This file is kept for backwards compatibility during migration.
 * Use types from convex/_generated/dataModel for new code.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Minimal Database type stub
export interface Database {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}
