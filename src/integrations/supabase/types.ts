export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_hash: string | null
          metadata: Json | null
          project_id: string | null
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          project_id?: string | null
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          project_id?: string | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          display_name: string
          id: string
          name: string
          order_index: number
          project_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          name: string
          order_index?: number
          project_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          name?: string
          order_index?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_verification_requests: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          portfolio_links: Json | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          twitter_handle: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          portfolio_links?: Json | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          twitter_handle: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          portfolio_links?: Json | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          twitter_handle?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_purchases: {
        Row: {
          completed_at: string | null
          created_at: string
          credits_amount: number
          id: string
          nmkr_payment_id: string | null
          price_ada: number
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credits_amount: number
          id?: string
          nmkr_payment_id?: string | null
          price_ada: number
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credits_amount?: number
          id?: string
          nmkr_payment_id?: string | null
          price_ada?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          generation_id: string | null
          generation_type: string | null
          id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          generation_id?: string | null
          generation_type?: string | null
          id?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          generation_id?: string | null
          generation_type?: string | null
          id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      generation_comments: {
        Row: {
          content: string
          created_at: string | null
          generation_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          generation_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          generation_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          batch_size: number | null
          created_at: string
          generation_type: string
          id: string
          image_path: string | null
          is_favorite: boolean
          layer_combination: string[]
          metadata: Json
          project_id: string
          token_id: string
        }
        Insert: {
          batch_size?: number | null
          created_at?: string
          generation_type?: string
          id?: string
          image_path?: string | null
          is_favorite?: boolean
          layer_combination: string[]
          metadata: Json
          project_id: string
          token_id: string
        }
        Update: {
          batch_size?: number | null
          created_at?: string
          generation_type?: string
          id?: string
          image_path?: string | null
          is_favorite?: boolean
          layer_combination?: string[]
          metadata?: Json
          project_id?: string
          token_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      layer_effects: {
        Row: {
          created_at: string
          effect_layer_id: string
          id: string
          parent_layer_id: string
          render_order: number
        }
        Insert: {
          created_at?: string
          effect_layer_id: string
          id?: string
          parent_layer_id: string
          render_order?: number
        }
        Update: {
          created_at?: string
          effect_layer_id?: string
          id?: string
          parent_layer_id?: string
          render_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "layer_effects_effect_layer_id_fkey"
            columns: ["effect_layer_id"]
            isOneToOne: false
            referencedRelation: "layers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layer_effects_parent_layer_id_fkey"
            columns: ["parent_layer_id"]
            isOneToOne: false
            referencedRelation: "layers"
            referencedColumns: ["id"]
          },
        ]
      }
      layer_exclusions: {
        Row: {
          created_at: string
          excluded_layer_id: string
          id: string
          layer_id: string
        }
        Insert: {
          created_at?: string
          excluded_layer_id: string
          id?: string
          layer_id: string
        }
        Update: {
          created_at?: string
          excluded_layer_id?: string
          id?: string
          layer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "layer_exclusions_excluded_layer_id_fkey"
            columns: ["excluded_layer_id"]
            isOneToOne: false
            referencedRelation: "layers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layer_exclusions_layer_id_fkey"
            columns: ["layer_id"]
            isOneToOne: false
            referencedRelation: "layers"
            referencedColumns: ["id"]
          },
        ]
      }
      layer_switches: {
        Row: {
          created_at: string
          id: string
          layer_a_id: string
          layer_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          layer_a_id: string
          layer_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          layer_a_id?: string
          layer_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "layer_switches_layer_a_id_fkey"
            columns: ["layer_a_id"]
            isOneToOne: false
            referencedRelation: "layers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layer_switches_layer_b_id_fkey"
            columns: ["layer_b_id"]
            isOneToOne: false
            referencedRelation: "layers"
            referencedColumns: ["id"]
          },
        ]
      }
      layers: {
        Row: {
          category_id: string
          created_at: string
          display_name: string
          filename: string
          id: string
          is_effect_layer: boolean
          order_index: number
          rarity_weight: number
          storage_path: string
          thumbnail_path: string | null
          trait_name: string
        }
        Insert: {
          category_id: string
          created_at?: string
          display_name: string
          filename: string
          id?: string
          is_effect_layer?: boolean
          order_index?: number
          rarity_weight?: number
          storage_path: string
          thumbnail_path?: string | null
          trait_name: string
        }
        Update: {
          category_id?: string
          created_at?: string
          display_name?: string
          filename?: string
          id?: string
          is_effect_layer?: boolean
          order_index?: number
          rarity_weight?: number
          storage_path?: string
          thumbnail_path?: string | null
          trait_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "layers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_requests: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          created_at: string | null
          duration_days: number | null
          end_date: string | null
          hero_image_url: string | null
          id: string
          message: string | null
          payment_status: string | null
          price_ada: number
          project_id: string
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          created_at?: string | null
          duration_days?: number | null
          end_date?: string | null
          hero_image_url?: string | null
          id?: string
          message?: string | null
          payment_status?: string | null
          price_ada: number
          project_id: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          created_at?: string | null
          duration_days?: number | null
          end_date?: string | null
          hero_image_url?: string | null
          id?: string
          message?: string | null
          payment_status?: string | null
          price_ada?: number
          project_id?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      nmkr_projects: {
        Row: {
          created_at: string
          id: string
          network: string
          nmkr_policy_id: string | null
          nmkr_project_uid: string
          price_in_lovelace: number | null
          project_id: string
          settings: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          network?: string
          nmkr_policy_id?: string | null
          nmkr_project_uid: string
          price_in_lovelace?: number | null
          project_id: string
          settings?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          network?: string
          nmkr_policy_id?: string | null
          nmkr_project_uid?: string
          price_in_lovelace?: number | null
          project_id?: string
          settings?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nmkr_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      nmkr_uploads: {
        Row: {
          created_at: string
          error_message: string | null
          generation_id: string
          id: string
          nmkr_nft_uid: string | null
          nmkr_project_id: string
          token_name: string
          updated_at: string
          upload_status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          generation_id: string
          id?: string
          nmkr_nft_uid?: string | null
          nmkr_project_id: string
          token_name: string
          updated_at?: string
          upload_status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          generation_id?: string
          id?: string
          nmkr_nft_uid?: string | null
          nmkr_project_id?: string
          token_name?: string
          updated_at?: string
          upload_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "nmkr_uploads_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: true
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nmkr_uploads_nmkr_project_id_fkey"
            columns: ["nmkr_project_id"]
            isOneToOne: false
            referencedRelation: "nmkr_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      operational_costs: {
        Row: {
          amount_usd: number
          billing_period: string
          category: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          name: string
          notes: string | null
          start_date: string
        }
        Insert: {
          amount_usd: number
          billing_period: string
          category: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          start_date: string
        }
        Update: {
          amount_usd?: number
          billing_period?: string
          category?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_costs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_credit_payments: {
        Row: {
          completed_at: string | null
          created_at: string
          credits_amount: number
          dust_amount: number
          expected_amount_lovelace: number
          expires_at: string
          id: string
          price_ada: number
          status: string
          tier_id: string
          tx_hash: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credits_amount: number
          dust_amount: number
          expected_amount_lovelace: number
          expires_at?: string
          id?: string
          price_ada: number
          status?: string
          tier_id: string
          tx_hash?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credits_amount?: number
          dust_amount?: number
          expected_amount_lovelace?: number
          expires_at?: string
          id?: string
          price_ada?: number
          status?: string
          tier_id?: string
          tx_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pending_marketing_payments: {
        Row: {
          completed_at: string | null
          created_at: string
          dust_amount: number
          expected_amount_lovelace: number
          expires_at: string
          id: string
          marketing_request_id: string
          price_ada: number
          status: string
          tx_hash: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          dust_amount: number
          expected_amount_lovelace: number
          expires_at?: string
          id?: string
          marketing_request_id: string
          price_ada: number
          status?: string
          tx_hash?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          dust_amount?: number
          expected_amount_lovelace?: number
          expires_at?: string
          id?: string
          marketing_request_id?: string
          price_ada?: number
          status?: string
          tx_hash?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_marketing_payments_marketing_request_id_fkey"
            columns: ["marketing_request_id"]
            isOneToOne: false
            referencedRelation: "marketing_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      product_pages: {
        Row: {
          admin_approved: boolean | null
          banner_url: string | null
          buy_button_enabled: boolean | null
          buy_button_link: string | null
          buy_button_text: string | null
          created_at: string
          discord_url: string | null
          featured_until: string | null
          founder_bio: string | null
          founder_name: string | null
          founder_pfp_url: string | null
          founder_twitter: string | null
          founder_verified: boolean | null
          id: string
          is_featured: boolean | null
          is_hidden: boolean | null
          is_live: boolean | null
          logo_url: string | null
          max_supply: number | null
          portfolio: Json | null
          project_id: string
          rejection_reason: string | null
          scheduled_launch_at: string | null
          secondary_market_url: string | null
          tagline: string | null
          twitter_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          admin_approved?: boolean | null
          banner_url?: string | null
          buy_button_enabled?: boolean | null
          buy_button_link?: string | null
          buy_button_text?: string | null
          created_at?: string
          discord_url?: string | null
          featured_until?: string | null
          founder_bio?: string | null
          founder_name?: string | null
          founder_pfp_url?: string | null
          founder_twitter?: string | null
          founder_verified?: boolean | null
          id?: string
          is_featured?: boolean | null
          is_hidden?: boolean | null
          is_live?: boolean | null
          logo_url?: string | null
          max_supply?: number | null
          portfolio?: Json | null
          project_id: string
          rejection_reason?: string | null
          scheduled_launch_at?: string | null
          secondary_market_url?: string | null
          tagline?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          admin_approved?: boolean | null
          banner_url?: string | null
          buy_button_enabled?: boolean | null
          buy_button_link?: string | null
          buy_button_text?: string | null
          created_at?: string
          discord_url?: string | null
          featured_until?: string | null
          founder_bio?: string | null
          founder_name?: string | null
          founder_pfp_url?: string | null
          founder_twitter?: string | null
          founder_verified?: boolean | null
          id?: string
          is_featured?: boolean | null
          is_hidden?: boolean | null
          is_live?: boolean | null
          logo_url?: string | null
          max_supply?: number | null
          portfolio?: Json | null
          project_id?: string
          rejection_reason?: string | null
          scheduled_launch_at?: string | null
          secondary_market_url?: string | null
          tagline?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepted_terms_at: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_verified_creator: boolean | null
          marketing_consent: boolean | null
          twitter_handle: string | null
          updated_at: string
        }
        Insert: {
          accepted_terms_at?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          is_verified_creator?: boolean | null
          marketing_consent?: boolean | null
          twitter_handle?: string | null
          updated_at?: string
        }
        Update: {
          accepted_terms_at?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_verified_creator?: boolean | null
          marketing_consent?: boolean | null
          twitter_handle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          project_id: string
          role: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          project_id: string
          role?: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          project_id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          deletion_warning_sent_at: string | null
          description: string | null
          id: string
          is_public: boolean
          is_tutorial_template: boolean | null
          last_modified: string
          name: string
          owner_id: string
          settings: Json | null
          token_prefix: string
          token_start_number: number
        }
        Insert: {
          created_at?: string
          deletion_warning_sent_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          is_tutorial_template?: boolean | null
          last_modified?: string
          name: string
          owner_id: string
          settings?: Json | null
          token_prefix?: string
          token_start_number?: number
        }
        Update: {
          created_at?: string
          deletion_warning_sent_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          is_tutorial_template?: boolean | null
          last_modified?: string
          name?: string
          owner_id?: string
          settings?: Json | null
          token_prefix?: string
          token_start_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action_type: string
          count: number
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          action_type: string
          count?: number
          id?: string
          user_id: string
          window_start?: string
        }
        Update: {
          action_type?: string
          count?: number
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_step: number | null
          id: string
          skipped_at: string | null
          tutorial_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          skipped_at?: string | null
          tutorial_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          skipped_at?: string | null
          tutorial_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          free_credits: number
          id: string
          next_reset_at: string
          purchased_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          free_credits?: number
          id?: string
          next_reset_at: string
          purchased_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          free_credits?: number
          id?: string
          next_reset_at?: string
          purchased_credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_nmkr_credentials: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_valid: boolean | null
          last_validated_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_valid?: boolean | null
          last_validated_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_valid?: boolean | null
          last_validated_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verified_twitter_handles: {
        Row: {
          created_at: string
          id: string
          twitter_handle: string
          user_id: string
          verified_at: string
          verified_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          twitter_handle: string
          user_id: string
          verified_at?: string
          verified_by: string
        }
        Update: {
          created_at?: string
          id?: string
          twitter_handle?: string
          user_id?: string
          verified_at?: string
          verified_by?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_project_invitation: {
        Args: { invitation_id: string }
        Returns: undefined
      }
      activate_marketing_on_schedule: { Args: never; Returns: number }
      add_purchased_credits: {
        Args: { p_amount: number; p_description?: string; p_user_id: string }
        Returns: undefined
      }
      check_and_reset_credits: {
        Args: { p_user_id: string }
        Returns: {
          free_credits: number
          next_reset_at: string
          purchased_credits: number
        }[]
      }
      decline_project_invitation: {
        Args: { invitation_id: string }
        Returns: undefined
      }
      deduct_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_generation_id?: string
          p_generation_type?: string
          p_user_id: string
        }
        Returns: boolean
      }
      expire_pending_marketing_payments: { Args: never; Returns: number }
      expire_pending_payments: { Args: never; Returns: number }
      get_my_pending_invitations: {
        Args: never
        Returns: {
          created_at: string
          expires_at: string
          id: string
          inviter_name: string
          project_description: string
          project_id: string
          project_name: string
          role: string
        }[]
      }
      get_project_id_from_storage_path: {
        Args: { path: string }
        Returns: string
      }
      has_project_access: {
        Args: { project_uuid: string; user_uuid: string }
        Returns: boolean
      }
      has_project_write_access: {
        Args: { project_uuid: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_ada_payment: {
        Args: { p_expected_amount_lovelace: number; p_tx_hash: string }
        Returns: {
          already_processed: boolean
          credits_amount: number
          payment_id: string
          user_id: string
        }[]
      }
      process_marketing_payment: {
        Args: { p_expected_amount_lovelace: number; p_tx_hash: string }
        Returns: {
          already_processed: boolean
          marketing_request_id: string
          payment_id: string
          user_id: string
        }[]
      }
      project_has_live_product_page: {
        Args: { project_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
