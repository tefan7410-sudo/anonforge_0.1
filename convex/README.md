# Convex Backend

This folder will contain the Convex backend for AnonForge.

## Migration Status

The frontend has been stripped of Supabase dependencies and now uses stub functions.
The following files in `src/integrations/supabase/` need to be replaced with Convex:

- `client.ts` - Stub client, replace with Convex client
- `types.ts` - Database types (use as reference for Convex schema)

## Setup Instructions

1. Install Convex:
   ```bash
   npm install convex
   ```

2. Initialize Convex:
   ```bash
   npx convex dev
   ```

3. Create your schema based on the existing types in `src/integrations/supabase/types.ts`

## Tables to Migrate

Based on the existing Supabase schema, these tables need to be created in Convex:

### Core Tables
- `profiles` - User profiles
- `projects` - NFT generation projects
- `categories` - Layer categories within projects
- `layers` - Individual layer files
- `generations` - Generated NFT outputs

### Features
- `layer_exclusions` - Layer exclusion rules
- `layer_effects` - Layer effect relationships
- `layer_switches` - Layer switch rules

### Credits & Payments
- `user_credits` - User credit balances
- `credit_transactions` - Credit usage history
- `credit_purchases` - Credit purchase records
- `pending_credit_payments` - Pending ADA payments

### NMKR Integration
- `nmkr_projects` - NMKR project links
- `nmkr_uploads` - NMKR upload records
- `user_nmkr_credentials` - User API keys

### Marketing & Product Pages
- `product_pages` - Public collection pages
- `marketing_requests` - Marketing promotion requests
- `pending_marketing_payments` - Marketing payment records

### Admin & System
- `user_roles` - User role assignments
- `notifications` - User notifications
- `bug_reports` - User bug reports
- `activity_logs` - Activity tracking
- `admin_audit_logs` - Admin action logs
- `service_status` - Service health status
- `status_incidents` - Incident reports
- `site_settings` - Site configuration

### Ambassador Program
- `ambassador_requests` - Ambassador applications
- `creator_verification_requests` - Creator verification

### Art Fund
- `art_fund_settings` - Art fund configuration
- `art_fund_sources` - Art fund income sources

### Tutorial
- `tutorial_progress` - User tutorial progress

## Authentication

Replace Supabase Auth with one of:
- Clerk (recommended for Convex)
- Auth0
- Custom JWT auth

See: https://docs.convex.dev/auth
