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
      layers: {
        Row: {
          category_id: string
          created_at: string
          display_name: string
          filename: string
          id: string
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
      product_pages: {
        Row: {
          banner_url: string | null
          created_at: string
          discord_url: string | null
          founder_bio: string | null
          founder_name: string | null
          founder_pfp_url: string | null
          founder_twitter: string | null
          id: string
          logo_url: string | null
          portfolio: Json | null
          project_id: string
          tagline: string | null
          twitter_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          discord_url?: string | null
          founder_bio?: string | null
          founder_name?: string | null
          founder_pfp_url?: string | null
          founder_twitter?: string | null
          id?: string
          logo_url?: string | null
          portfolio?: Json | null
          project_id: string
          tagline?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          discord_url?: string | null
          founder_bio?: string | null
          founder_name?: string | null
          founder_pfp_url?: string | null
          founder_twitter?: string | null
          id?: string
          logo_url?: string | null
          portfolio?: Json | null
          project_id?: string
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
          marketing_consent: boolean | null
          updated_at: string
        }
        Insert: {
          accepted_terms_at?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          marketing_consent?: boolean | null
          updated_at?: string
        }
        Update: {
          accepted_terms_at?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          marketing_consent?: boolean | null
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
          description: string | null
          id: string
          is_public: boolean
          last_modified: string
          name: string
          owner_id: string
          settings: Json | null
          token_prefix: string
          token_start_number: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          last_modified?: string
          name: string
          owner_id: string
          settings?: Json | null
          token_prefix?: string
          token_start_number?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_project_invitation: {
        Args: { invitation_id: string }
        Returns: undefined
      }
      decline_project_invitation: {
        Args: { invitation_id: string }
        Returns: undefined
      }
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
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
