# AnonForge - Supabase to Convex Migration

## Current Status

✅ **Phase 1 Complete**: Convex foundation is set up and deployed to Vercel  
⏳ **Phase 2 In Progress**: Hooks need to be updated to use Convex directly

---

## What Has Been Done

### 1. Convex Setup
- Installed `convex` package
- Created full Convex schema (`convex/schema.ts`) with 25+ tables
- Created Convex functions for all major entities:
  - `convex/auth.ts` - Authentication helpers
  - `convex/profiles.ts` - User profiles
  - `convex/projects.ts` - NFT projects
  - `convex/credits.ts` - Credit system
  - `convex/status.ts` - Service status
  - `convex/notifications.ts` - User notifications
  - `convex/marketing.ts` - Marketing/featured projects
  - `convex/categories.ts` - Trait categories
  - `convex/layers.ts` - Layer management
  - `convex/generations.ts` - Generation history
  - `convex/productPages.ts` - Product pages
  - `convex/admin.ts` - Admin functions
  - `convex/files.ts` - File storage

### 2. Clerk Auth Integration
- Installed `@clerk/clerk-react`
- Updated `src/App.tsx` with `ClerkProvider` + `ConvexProviderWithClerk`
- Updated `src/contexts/AuthContext.tsx` to use Clerk when configured
- Falls back to mock auth for development without Clerk

### 3. Supabase Stub Layer
- `src/integrations/supabase/client.ts` - Mock client for transition period
- Allows existing hooks to work while Convex is being integrated
- All UI continues to render with mock data

### 4. Deployment
- Deployed to Vercel: https://anonforge.vercel.app
- Git workflow: Push to main → Vercel auto-deploys

---

## Next Steps to Complete Migration

### Step 1: Initialize Convex Backend

Run this in a terminal:

```bash
./scripts/setup-convex.sh
# Or manually:
npx convex dev
```

This will:
1. Open browser for Convex login
2. Create a new Convex project
3. Generate the `convex/_generated/` types
4. Add `CONVEX_URL` to `.env.local`

### Step 2: Set Up Clerk

1. Create account at https://clerk.com
2. Create a new application
3. Get your Publishable Key
4. Add to `.env.local`:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   ```
5. In Clerk dashboard, configure JWT template for Convex

### Step 3: Migrate Hooks to Convex

Each hook needs to be updated from React Query + Supabase to Convex:

```typescript
// BEFORE (Supabase stub)
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId);
      return data;
    },
  });
}

// AFTER (Convex)
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function useProfile(userId: string) {
  return useQuery(api.profiles.get, { userId });
}
```

### Step 4: Remove Supabase Stubs

Once all hooks are migrated:

1. Delete `src/integrations/supabase/`
2. Remove `@supabase/supabase-js` from package.json (if still present)
3. Update any remaining imports

---

## Files Still Using Supabase Stub

These files import from `@/integrations/supabase/client`:

### High Priority (Core Functionality)
- `src/hooks/use-profile.ts`
- `src/hooks/use-project.ts`
- `src/hooks/use-credits.ts`
- `src/hooks/use-status.ts`
- `src/contexts/AuthContext.tsx`

### Medium Priority (Features)
- `src/hooks/use-marketing.ts`
- `src/hooks/use-notifications.ts`
- `src/hooks/use-generations.ts`
- `src/hooks/use-product-page.ts`
- `src/hooks/use-hero-backgrounds.ts`

### Lower Priority (Admin/Special)
- `src/hooks/use-admin*.ts`
- `src/hooks/use-ambassador.ts`
- `src/hooks/use-bug-reports.ts`
- `src/hooks/use-verification-request.ts`

---

## Development Commands

```bash
# Start frontend dev server
npm run dev

# Start Convex dev server (in separate terminal)
npm run dev:convex

# Start both in parallel
npm run dev:all

# Deploy Convex to production
npm run convex:deploy

# Build for production
npm run build
```

---

## Environment Variables

Create `.env.local` with:

```bash
# Convex (required)
VITE_CONVEX_URL=https://your-project.convex.cloud

# Clerk Auth (required for auth)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

---

## Resources

- Convex Docs: https://docs.convex.dev
- Clerk + Convex: https://docs.convex.dev/auth/clerk
- Convex File Storage: https://docs.convex.dev/file-storage
- Vercel Dashboard: https://vercel.com/bajuz/anonforge
