import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles
  profiles: defineTable({
    email: v.string(),
    display_name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    twitter_handle: v.optional(v.string()),
    wallet_address: v.optional(v.string()),
    stake_address: v.optional(v.string()),
    is_verified_creator: v.optional(v.boolean()),
    accepted_terms_at: v.optional(v.string()),
    email_verified_at: v.optional(v.string()),
  }).index("by_email", ["email"])
    .index("by_wallet", ["wallet_address"])
    .index("by_stake", ["stake_address"]),

  // User roles (admin, moderator, etc)
  user_roles: defineTable({
    user_id: v.string(),
    role: v.string(),
  }).index("by_user", ["user_id"]),

  // User credits
  user_credits: defineTable({
    user_id: v.string(),
    free_credits: v.number(),
    purchased_credits: v.number(),
    next_reset_at: v.optional(v.string()),
  }).index("by_user", ["user_id"]),

  // Credit transactions
  credit_transactions: defineTable({
    user_id: v.string(),
    amount: v.number(),
    transaction_type: v.string(),
    description: v.optional(v.string()),
    generation_id: v.optional(v.string()),
    generation_type: v.optional(v.string()),
    payment_id: v.optional(v.string()),
  }).index("by_user", ["user_id"]),

  // Projects
  projects: defineTable({
    owner_id: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    is_public: v.boolean(),
    token_prefix: v.string(),
    token_start_number: v.number(),
    settings: v.optional(v.any()),
    nmkr_project_uid: v.optional(v.string()),
    nmkr_api_key_encrypted: v.optional(v.string()),
  }).index("by_owner", ["owner_id"])
    .index("by_nmkr", ["nmkr_project_uid"]),

  // Project members (team)
  project_members: defineTable({
    project_id: v.id("projects"),
    user_id: v.string(),
    role: v.string(),
    invited_by: v.optional(v.string()),
    accepted_at: v.optional(v.string()),
  }).index("by_project", ["project_id"])
    .index("by_user", ["user_id"]),

  // Categories (trait categories)
  categories: defineTable({
    project_id: v.id("projects"),
    name: v.string(),
    display_name: v.string(),
    order_index: v.number(),
  }).index("by_project", ["project_id"]),

  // Layers (individual traits)
  layers: defineTable({
    category_id: v.id("categories"),
    filename: v.string(),
    trait_name: v.string(),
    display_name: v.string(),
    storage_path: v.string(),
    rarity_weight: v.number(),
    order_index: v.number(),
    is_effect_layer: v.optional(v.boolean()),
    effect_type: v.optional(v.string()),
    effect_blend_mode: v.optional(v.string()),
    effect_opacity: v.optional(v.number()),
  }).index("by_category", ["category_id"]),

  // Layer exclusions
  layer_exclusions: defineTable({
    layer_id: v.id("layers"),
    excluded_layer_id: v.id("layers"),
  }).index("by_layer", ["layer_id"]),

  // Layer effects
  layer_effects: defineTable({
    layer_id: v.id("layers"),
    effect_layer_id: v.id("layers"),
  }).index("by_layer", ["layer_id"]),

  // Generations
  generations: defineTable({
    project_id: v.id("projects"),
    user_id: v.string(),
    name: v.string(),
    count: v.number(),
    settings: v.optional(v.any()),
    status: v.string(),
    progress: v.number(),
    error_message: v.optional(v.string()),
    output_zip_url: v.optional(v.string()),
    generated_images: v.optional(v.any()),
    completed_at: v.optional(v.string()),
  }).index("by_project", ["project_id"])
    .index("by_user", ["user_id"]),

  // Generation comments
  generation_comments: defineTable({
    generation_id: v.id("generations"),
    user_id: v.string(),
    content: v.string(),
    parent_id: v.optional(v.id("generation_comments")),
  }).index("by_generation", ["generation_id"]),

  // Product pages
  product_pages: defineTable({
    project_id: v.id("projects"),
    slug: v.optional(v.string()),
    tagline: v.optional(v.string()),
    logo_url: v.optional(v.string()),
    banner_url: v.optional(v.string()),
    collection_type: v.optional(v.string()),
    max_supply: v.optional(v.number()),
    twitter_url: v.optional(v.string()),
    discord_url: v.optional(v.string()),
    website_url: v.optional(v.string()),
    founder_name: v.optional(v.string()),
    founder_bio: v.optional(v.string()),
    founder_pfp_url: v.optional(v.string()),
    founder_twitter: v.optional(v.string()),
    buy_button_enabled: v.optional(v.boolean()),
    buy_button_text: v.optional(v.string()),
    buy_button_link: v.optional(v.string()),
    is_live: v.optional(v.boolean()),
    is_featured: v.optional(v.boolean()),
    is_hidden: v.optional(v.boolean()),
    featured_until: v.optional(v.string()),
    admin_approved: v.optional(v.boolean()),
  }).index("by_project", ["project_id"])
    .index("by_slug", ["slug"]),

  // Marketing requests
  marketing_requests: defineTable({
    project_id: v.id("projects"),
    user_id: v.string(),
    status: v.string(),
    duration_days: v.number(),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    price_ada: v.number(),
    message: v.optional(v.string()),
    hero_image_url: v.optional(v.string()),
    payment_status: v.optional(v.string()),
    payment_address: v.optional(v.string()),
    payment_tx_hash: v.optional(v.string()),
    approved_at: v.optional(v.string()),
    admin_notes: v.optional(v.string()),
  }).index("by_project", ["project_id"])
    .index("by_user", ["user_id"])
    .index("by_status", ["status"]),

  // Notifications
  notifications: defineTable({
    user_id: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    is_read: v.boolean(),
    metadata: v.optional(v.any()),
  }).index("by_user", ["user_id"]),

  // Bug reports
  bug_reports: defineTable({
    user_id: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    severity: v.optional(v.string()),
    status: v.string(),
    admin_notes: v.optional(v.string()),
    screenshot_url: v.optional(v.string()),
    session_log: v.optional(v.any()),
    browser_info: v.optional(v.any()),
    updated_at: v.optional(v.string()),
  }).index("by_status", ["status"]),

  // Verification requests
  verification_requests: defineTable({
    user_id: v.string(),
    status: v.string(),
    portfolio_url: v.optional(v.string()),
    twitter_url: v.optional(v.string()),
    description: v.optional(v.string()),
    reviewed_at: v.optional(v.string()),
    admin_notes: v.optional(v.string()),
  }).index("by_user", ["user_id"])
    .index("by_status", ["status"]),

  // Hero backgrounds (landing page)
  hero_backgrounds: defineTable({
    image_url: v.string(),
    storage_path: v.string(),
    is_active: v.boolean(),
    display_order: v.number(),
  }),

  // Site settings
  site_settings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  // Service status
  service_status: defineTable({
    service_name: v.string(),
    status: v.string(),
    error_message: v.optional(v.string()),
    last_check_at: v.optional(v.string()),
  }).index("by_name", ["service_name"]),

  // Status incidents
  status_incidents: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    severity: v.string(),
    is_active: v.boolean(),
    affected_services: v.optional(v.array(v.string())),
    resolved_at: v.optional(v.string()),
  }).index("by_active", ["is_active"]),

  // Art fund donations
  art_fund_donations: defineTable({
    user_id: v.optional(v.string()),
    amount_ada: v.number(),
    tx_hash: v.optional(v.string()),
    message: v.optional(v.string()),
    is_anonymous: v.optional(v.boolean()),
  }).index("by_user", ["user_id"]),

  // Art fund payouts
  art_fund_payouts: defineTable({
    recipient_id: v.string(),
    amount_ada: v.number(),
    status: v.string(),
    tx_hash: v.optional(v.string()),
    reason: v.optional(v.string()),
    approved_by: v.optional(v.string()),
  }).index("by_recipient", ["recipient_id"])
    .index("by_status", ["status"]),

  // Ambassador applications
  ambassador_applications: defineTable({
    user_id: v.string(),
    status: v.string(),
    twitter_url: v.optional(v.string()),
    experience: v.optional(v.string()),
    motivation: v.optional(v.string()),
    reviewed_at: v.optional(v.string()),
    admin_notes: v.optional(v.string()),
  }).index("by_user", ["user_id"])
    .index("by_status", ["status"]),

  // Payment intents
  payment_intents: defineTable({
    user_id: v.string(),
    type: v.string(),
    amount_ada: v.number(),
    amount_lovelace: v.number(),
    payment_address: v.string(),
    status: v.string(),
    expires_at: v.string(),
    tx_hash: v.optional(v.string()),
    metadata: v.optional(v.any()),
  }).index("by_user", ["user_id"])
    .index("by_address", ["payment_address"]),
});
