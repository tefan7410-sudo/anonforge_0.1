/**
 * DEPRECATED: Supabase has been replaced with Convex.
 * This stub is kept for backwards compatibility during migration.
 * All new code should use Convex hooks instead.
 */

// Minimal stub that provides a no-op interface
const noOp = () => ({
  select: () => noOp(),
  insert: () => noOp(),
  update: () => noOp(),
  delete: () => noOp(),
  eq: () => noOp(),
  neq: () => noOp(),
  in: () => noOp(),
  or: () => noOp(),
  gt: () => noOp(),
  gte: () => noOp(),
  lt: () => noOp(),
  lte: () => noOp(),
  order: () => noOp(),
  limit: () => noOp(),
  single: () => Promise.resolve({ data: null, error: null }),
  maybeSingle: () => Promise.resolve({ data: null, error: null }),
  then: (resolve: (value: { data: null; error: null }) => void) => {
    resolve({ data: null, error: null });
    return Promise.resolve({ data: null, error: null });
  },
});

export const supabase = {
  from: () => noOp(),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: () => Promise.resolve({ data: null, error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: null }),
    signInWithOAuth: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: { path: '' }, error: null }),
      download: () => Promise.resolve({ data: null, error: null }),
      remove: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '/placeholder.svg' } }),
      list: () => Promise.resolve({ data: [], error: null }),
    }),
  },
  functions: {
    invoke: () => Promise.resolve({ data: null, error: null }),
  },
  rpc: () => Promise.resolve({ data: null, error: null }),
  channel: () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    subscribe: () => ({ unsubscribe: () => {} }),
  }),
  removeChannel: () => {},
};

export type SupabaseClient = typeof supabase;
