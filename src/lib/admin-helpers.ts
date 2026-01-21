// This file is deprecated - profiles are now fetched directly via Convex queries
// Keeping for backwards compatibility but should be removed once all components are updated

export interface ProfileData {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

/**
 * Fetch profiles for a list of user IDs.
 * Returns a Map for easy lookup.
 * 
 * @deprecated Use Convex queries directly instead
 */
export async function fetchProfilesForUserIds(userIds: string[]): Promise<Map<string, ProfileData>> {
  if (userIds.length === 0) {
    return new Map();
  }

  // This function is no longer used since hooks fetch profiles directly
  // Return empty map for backwards compatibility
  console.warn('fetchProfilesForUserIds is deprecated - use Convex queries directly');
  return new Map();
}
