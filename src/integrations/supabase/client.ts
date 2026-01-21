/**
 * STUB: Supabase client replacement
 * This file provides a mock implementation that maintains the same interface
 * as the original Supabase client. Replace with Convex integration.
 * 
 * TODO: Replace with Convex client
 */

import type { Database } from './types';

// Mock user for development
const MOCK_USER = {
  id: 'mock-user-id-12345',
  email: 'demo@anonforge.com',
  app_metadata: {},
  user_metadata: { display_name: 'Demo User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

// Mock session
const MOCK_SESSION = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: MOCK_USER,
};

type AuthChangeCallback = (event: string, session: typeof MOCK_SESSION | null) => void;

// Auth state management
let currentSession: typeof MOCK_SESSION | null = null;
let authListeners: AuthChangeCallback[] = [];

// Stub auth module
const auth = {
  getSession: async () => ({ data: { session: currentSession }, error: null }),
  getUser: async () => ({ data: { user: currentSession?.user ?? null }, error: null }),
  
  signUp: async ({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, unknown> } }) => {
    currentSession = { ...MOCK_SESSION, user: { ...MOCK_USER, email, user_metadata: options?.data || {} } };
    authListeners.forEach(cb => cb('SIGNED_IN', currentSession));
    return { data: { user: currentSession.user, session: currentSession }, error: null };
  },
  
  signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
    currentSession = { ...MOCK_SESSION, user: { ...MOCK_USER, email } };
    authListeners.forEach(cb => cb('SIGNED_IN', currentSession));
    return { data: { user: currentSession.user, session: currentSession }, error: null };
  },
  
  signInWithOAuth: async ({ provider, options }: { provider: string; options?: { redirectTo?: string } }) => {
    return { data: { provider, url: null }, error: null };
  },
  
  signOut: async () => {
    currentSession = null;
    authListeners.forEach(cb => cb('SIGNED_OUT', null));
    return { error: null };
  },
  
  resetPasswordForEmail: async (email: string, options?: { redirectTo?: string }) => {
    return { data: {}, error: null };
  },
  
  onAuthStateChange: (callback: AuthChangeCallback) => {
    authListeners.push(callback);
    // Immediately call with current state
    setTimeout(() => callback(currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', currentSession), 0);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authListeners = authListeners.filter(cb => cb !== callback);
          },
        },
      },
    };
  },
};

// Mock data store - returns appropriate data for each table
const getMockDataForTable = (table: string, filters: Record<string, unknown>, isSingle: boolean): unknown => {
  switch (table) {
    case 'profiles':
      if (filters.id || isSingle) {
        return {
          id: filters.id || 'mock-user-id-12345',
          email: 'demo@anonforge.com',
          display_name: 'Demo User',
          avatar_url: null,
          twitter_handle: null,
          is_verified_creator: false,
          stake_address: null,
          wallet_address: null,
          wallet_connected_at: null,
          accepted_terms_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return [];
      
    case 'site_settings':
      // Return null for single queries - no settings by default
      if (isSingle) return null;
      return [];
      
    case 'user_credits':
      if (isSingle) {
        return { 
          free_credits: 100, 
          purchased_credits: 0, 
          next_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
        };
      }
      return [];
      
    case 'marketing_requests':
      // Return null for active marketing - no featured items
      return isSingle ? null : [];
      
    case 'hero_backgrounds':
      // Return empty - no custom backgrounds
      return [];
      
    case 'status_incidents':
      return [];
      
    case 'service_status':
      return [];
      
    case 'product_pages':
      return isSingle ? null : [];
      
    case 'projects':
      return isSingle ? null : [];
      
    case 'user_roles':
      return isSingle ? null : [];
      
    case 'notifications':
      return [];
      
    case 'tutorial_progress':
      return isSingle ? null : [];
      
    default:
      return isSingle ? null : [];
  }
};

// Create a chainable query builder with proper Promise support
const createQueryBuilder = (tableName: string) => {
  let filters: Record<string, unknown> = {};
  let isSingleResult = false;
  let isMaybeSingle = false;
  
  const resolveQuery = () => {
    const mockData = getMockDataForTable(tableName, filters, isSingleResult || isMaybeSingle);
    return { data: mockData, error: null };
  };

  const builder: Record<string, unknown> = {
    select: (fields: string = '*') => builder,
    insert: (data: unknown) => builder,
    update: (data: unknown) => builder,
    upsert: (data: unknown) => builder,
    delete: () => builder,
    eq: (column: string, value: unknown) => {
      filters[column] = value;
      return builder;
    },
    neq: (column: string, value: unknown) => builder,
    in: (column: string, values: unknown[]) => builder,
    or: (query: string) => builder,
    and: (query: string) => builder,
    gt: (column: string, value: unknown) => builder,
    gte: (column: string, value: unknown) => builder,
    lt: (column: string, value: unknown) => builder,
    lte: (column: string, value: unknown) => builder,
    like: (column: string, value: unknown) => builder,
    ilike: (column: string, value: unknown) => builder,
    is: (column: string, value: unknown) => builder,
    order: (column: string, options?: { ascending?: boolean }) => builder,
    limit: (count: number) => builder,
    range: (from: number, to: number) => builder,
    
    single: () => {
      isSingleResult = true;
      return builder;
    },
    
    maybeSingle: () => {
      isMaybeSingle = true;
      return builder;
    },
    
    // Promise-like interface
    then: (onFulfilled?: (value: { data: unknown; error: null }) => unknown, onRejected?: (reason: unknown) => unknown) => {
      const result = resolveQuery();
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
    
    catch: (onRejected?: (reason: unknown) => unknown) => {
      return Promise.resolve(resolveQuery()).catch(onRejected);
    },
    
    finally: (onFinally?: () => void) => {
      return Promise.resolve(resolveQuery()).finally(onFinally);
    },
  };
  
  return builder;
};

// Stub storage module
const storage = {
  from: (bucket: string) => ({
    upload: async (path: string, file: File, options?: { upsert?: boolean }) => {
      return { data: { path }, error: null };
    },
    download: async (path: string) => {
      return { data: null, error: null };
    },
    remove: async (paths: string[]) => {
      return { data: null, error: null };
    },
    getPublicUrl: (path: string) => {
      return { data: { publicUrl: `/placeholder.svg` } };
    },
    list: async (path?: string) => {
      return { data: [], error: null };
    },
  }),
};

// Stub functions module
const functions = {
  invoke: async (functionName: string, options?: { method?: string; body?: unknown }) => {
    return { data: null, error: null };
  },
};

// Stub RPC function
const rpc = async (functionName: string, params?: Record<string, unknown>) => {
  
  // Return appropriate mock data for known RPC functions
  switch (functionName) {
    case 'get_my_pending_invitations':
      return { data: [], error: null };
    case 'check_and_reset_credits':
      return { 
        data: [{ free_credits: 100, next_reset_at: new Date().toISOString(), purchased_credits: 0 }], 
        error: null 
      };
    case 'has_role':
      return { data: false, error: null };
    case 'is_ambassador':
      return { data: false, error: null };
    default:
      return { data: null, error: null };
  }
};

// Main supabase client stub
export const supabase = {
  auth,
  storage,
  functions,
  rpc,
  from: (table: string) => createQueryBuilder(table),
  channel: (name: string) => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    subscribe: () => ({ unsubscribe: () => {} }),
  }),
  removeChannel: () => {},
};

// For type compatibility
export type SupabaseClient = typeof supabase;
