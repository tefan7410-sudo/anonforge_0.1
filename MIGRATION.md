# AnonForge - Supabase to Convex Migration

## Migration Summary

The frontend has been successfully cloned from `anonforge_0.1` and stripped of Supabase dependencies.

### What Was Done

1. **Cloned Repository**: Full frontend codebase from `github.com/tefan7410-sudo/anonforge_0.1`

2. **Removed Supabase Backend**:
   - Deleted `/supabase` folder (migrations, edge functions)
   - Removed `@supabase/supabase-js` package
   - Deleted `.env` file with Supabase credentials

3. **Created Stub Layer**:
   - `src/integrations/supabase/client.ts` - Stub client that maintains the same interface
   - Provides mock data so the UI renders
   - Logs all database operations to console for debugging

4. **Updated Auth Context**:
   - `src/contexts/AuthContext.tsx` - Works with stub client
   - Sign in/up/out functions work (mock mode)

5. **Prepared Convex**:
   - Created `convex/` folder
   - Created `convex/schema.ts` with full schema based on Supabase types
   - Created `convex/README.md` with migration instructions

### Build Status

✅ **Build Successful** - No TypeScript errors
✅ **Dev Server Running** - App renders at `http://localhost:8080`

---

## Next Steps

### 1. Install & Initialize Convex

```bash
npm install convex
npx convex dev
```

### 2. Add Convex Client

Create `src/lib/convex.ts`:
```typescript
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

export { convex, ConvexProvider };
```

### 3. Wrap App with ConvexProvider

In `src/main.tsx`:
```typescript
import { ConvexProvider, convex } from './lib/convex';

<ConvexProvider client={convex}>
  <App />
</ConvexProvider>
```

### 4. Set Up Authentication

Choose one of:
- **Clerk** (recommended) - https://docs.convex.dev/auth/clerk
- **Auth0** - https://docs.convex.dev/auth/auth0
- **Custom JWT** - https://docs.convex.dev/auth/advanced

### 5. Migrate Hooks One by One

Each hook in `src/hooks/` uses Supabase queries. Convert them to use Convex:

```typescript
// Before (Supabase)
const { data } = await supabase.from('projects').select('*').eq('owner_id', userId);

// After (Convex)
const projects = useQuery(api.projects.listByOwner, { ownerId: userId });
```

### 6. Migrate Storage

Supabase Storage → Convex File Storage
- https://docs.convex.dev/file-storage

---

## Files Using Supabase (52 files)

These files import from `@/integrations/supabase/client` and need Convex migration:

### Pages (7 files)
- `src/pages/Register.tsx`
- `src/pages/ProjectSettings.tsx`
- `src/pages/Profile.tsx`
- `src/pages/NewProject.tsx`
- `src/pages/Marketplace.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Collection.tsx`

### Hooks (26 files)
- `src/hooks/use-admin.ts`
- `src/hooks/use-admin-ambassadors.ts`
- `src/hooks/use-admin-costs.ts`
- `src/hooks/use-admin-status.ts`
- `src/hooks/use-ambassador.ts`
- `src/hooks/use-art-fund.ts`
- `src/hooks/use-bug-reports.ts`
- `src/hooks/use-collection-status.ts`
- `src/hooks/use-content-moderation.ts`
- `src/hooks/use-creator-collections.ts`
- `src/hooks/use-credits.ts`
- `src/hooks/use-generation-comments.ts`
- `src/hooks/use-generations.ts`
- `src/hooks/use-hero-backgrounds.ts`
- `src/hooks/use-marketing.ts`
- `src/hooks/use-marketing-wallet-payment.ts`
- `src/hooks/use-mentions.ts`
- `src/hooks/use-nmkr.ts`
- `src/hooks/use-notifications.ts`
- `src/hooks/use-payment-intent.ts`
- `src/hooks/use-product-page.ts`
- `src/hooks/use-profile.ts`
- `src/hooks/use-project.ts`
- `src/hooks/use-project-role.ts`
- `src/hooks/use-status.ts`
- `src/hooks/use-team.ts`
- `src/hooks/use-tutorial.ts`
- `src/hooks/use-verification-request.ts`
- `src/hooks/use-wallet-auth.ts`
- `src/hooks/use-wallet-payment.ts`

### Contexts (1 file)
- `src/contexts/AuthContext.tsx`

### Components (11 files)
- `src/components/EmailVerificationPending.tsx`
- `src/components/MaintenanceGuard.tsx`
- `src/components/MarketplaceSection.tsx`
- `src/components/project/CategoryList.tsx`
- `src/components/project/ConnectionTypeModal.tsx`
- `src/components/project/GenerationDetailModal.tsx`
- `src/components/project/GenerationPanel.tsx`
- `src/components/project/LayerEffectsModal.tsx`
- `src/components/project/LayerExclusionsModal.tsx`
- `src/components/project/LayerSwitchModal.tsx`
- `src/components/project/LayerUploadZone.tsx`
- `src/components/project/nodes/LayerNode.tsx`

### Lib (1 file)
- `src/lib/admin-helpers.ts`

---

## Database Schema

The Convex schema has been created at `convex/schema.ts` with all 35+ tables from the original Supabase database.

---

## Support

For Convex documentation: https://docs.convex.dev
For issues with this migration: Check the stub client console logs
