import { supabase } from '@/integrations/supabase/client';

export interface ProfileData {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

/**
 * Fetch profiles for a list of user IDs.
 * Returns a Map for easy lookup.
 */
export async function fetchProfilesForUserIds(userIds: string[]): Promise<Map<string, ProfileData>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, email, avatar_url')
    .in('id', userIds);

  if (error) {
    console.error('Failed to fetch profiles:', error);
    return new Map();
  }

  const profileMap = new Map<string, ProfileData>();
  for (const profile of data || []) {
    profileMap.set(profile.id, profile);
  }

  return profileMap;
}
