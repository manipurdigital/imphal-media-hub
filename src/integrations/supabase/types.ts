export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      plan_feature_assignments: {
        Row: {
          created_at: string
          feature_id: string
          feature_value: Json
          id: string
          plan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature_id: string
          feature_value: Json
          id?: string
          plan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature_id?: string
          feature_value?: Json
          id?: string
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_feature_assignments_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "plan_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_feature_assignments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          feature_type: Database["public"]["Enums"]["feature_type"]
          id: string
          is_active: boolean
          name: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          feature_type?: Database["public"]["Enums"]["feature_type"]
          id?: string
          is_active?: boolean
          name: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          feature_type?: Database["public"]["Enums"]["feature_type"]
          id?: string
          is_active?: boolean
          name?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          clicked_video_id: string | null
          created_at: string
          id: string
          results_count: number | null
          search_query: string
          user_id: string | null
        }
        Insert: {
          clicked_video_id?: string | null
          created_at?: string
          id?: string
          results_count?: number | null
          search_query: string
          user_id?: string | null
        }
        Update: {
          clicked_video_id?: string | null
          created_at?: string
          id?: string
          results_count?: number | null
          search_query?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_history_clicked_video_id_fkey"
            columns: ["clicked_video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          email: string
          id: string
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          subscription_plan_id: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          email: string
          id?: string
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          subscription_plan_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          email?: string
          id?: string
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          subscription_plan_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscribers_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          created_at: string
          currency: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          price: number
          razorpay_plan_id: string | null
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          price: number
          razorpay_plan_id?: string | null
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price?: number
          razorpay_plan_id?: string | null
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          content_rating_preference: string | null
          created_at: string
          id: string
          preferred_genres: string[] | null
          preferred_languages: string[] | null
          recommendation_settings: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content_rating_preference?: string | null
          created_at?: string
          id?: string
          preferred_genres?: string[] | null
          preferred_languages?: string[] | null
          recommendation_settings?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content_rating_preference?: string | null
          created_at?: string
          id?: string
          preferred_genres?: string[] | null
          preferred_languages?: string[] | null
          recommendation_settings?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_id: string
          device_info: Json
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity: string
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          device_info?: Json
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          device_info?: Json
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          session_token?: string
          user_id?: string
        }
        Relationships: []
      }
      video_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          video_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          video_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_categories_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_collections: {
        Row: {
          collection_id: string
          created_at: string | null
          display_order: number | null
          id: string
          video_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          video_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_collections_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_sources: {
        Row: {
          bitrate: number | null
          created_at: string
          file_size: number | null
          id: string
          is_default: boolean
          quality_label: string
          resolution: string
          source_url: string
          updated_at: string
          video_id: string
        }
        Insert: {
          bitrate?: number | null
          created_at?: string
          file_size?: number | null
          id?: string
          is_default?: boolean
          quality_label: string
          resolution: string
          source_url: string
          updated_at?: string
          video_id: string
        }
        Update: {
          bitrate?: number | null
          created_at?: string
          file_size?: number | null
          id?: string
          is_default?: boolean
          quality_label?: string
          resolution?: string
          source_url?: string
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_sources_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_tags: {
        Row: {
          created_at: string | null
          id: string
          tag_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tag_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tag_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_tags_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          accessibility_checked_at: string | null
          accessibility_status: string | null
          cast_members: string[] | null
          content_status: Database["public"]["Enums"]["content_status"] | null
          content_type: Database["public"]["Enums"]["content_type"] | null
          created_at: string
          description: string | null
          director: string | null
          duration: number | null
          genre: string
          hosting_type: string | null
          id: string
          is_featured: boolean
          production_year: number | null
          rating: number | null
          search_vector: unknown | null
          thumbnail_url: string | null
          title: string
          trailer_url: string | null
          updated_at: string
          video_url: string
          view_count: number | null
          year: number | null
        }
        Insert: {
          accessibility_checked_at?: string | null
          accessibility_status?: string | null
          cast_members?: string[] | null
          content_status?: Database["public"]["Enums"]["content_status"] | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          description?: string | null
          director?: string | null
          duration?: number | null
          genre: string
          hosting_type?: string | null
          id?: string
          is_featured?: boolean
          production_year?: number | null
          rating?: number | null
          search_vector?: unknown | null
          thumbnail_url?: string | null
          title: string
          trailer_url?: string | null
          updated_at?: string
          video_url: string
          view_count?: number | null
          year?: number | null
        }
        Update: {
          accessibility_checked_at?: string | null
          accessibility_status?: string | null
          cast_members?: string[] | null
          content_status?: Database["public"]["Enums"]["content_status"] | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          description?: string | null
          director?: string | null
          duration?: number | null
          genre?: string
          hosting_type?: string | null
          id?: string
          is_featured?: boolean
          production_year?: number | null
          rating?: number | null
          search_vector?: unknown | null
          thumbnail_url?: string | null
          title?: string
          trailer_url?: string | null
          updated_at?: string
          video_url?: string
          view_count?: number | null
          year?: number | null
        }
        Relationships: []
      }
      viewing_history: {
        Row: {
          created_at: string
          id: string
          last_watched_at: string
          total_duration: number | null
          updated_at: string
          user_id: string | null
          video_id: string | null
          watch_duration: number | null
          watch_percentage: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_watched_at?: string
          total_duration?: number | null
          updated_at?: string
          user_id?: string | null
          video_id?: string | null
          watch_duration?: number | null
          watch_percentage?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_watched_at?: string
          total_duration?: number | null
          updated_at?: string
          user_id?: string | null
          video_id?: string | null
          watch_duration?: number | null
          watch_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "viewing_history_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      fix_video_sources_consistency: {
        Args: Record<PropertyKey, never>
        Returns: {
          action: string
          video_id: string
          video_title: string
          message: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      remove_unplayable_videos: {
        Args: Record<PropertyKey, never>
        Returns: {
          removed_count: number
          removed_titles: string[]
        }[]
      }
      set_featured_video: {
        Args: { _video_id: string }
        Returns: undefined
      }
      terminate_other_sessions: {
        Args: { _user_id: string; _current_session_token: string }
        Returns: number
      }
      validate_video_url_accessibility: {
        Args: Record<PropertyKey, never>
        Returns: {
          video_id: string
          video_title: string
          video_url: string
          hosting_type: string
          needs_check: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      billing_cycle: "monthly" | "yearly" | "one-time"
      content_status: "draft" | "published" | "archived"
      content_type: "movie" | "series" | "documentary" | "short" | "trailer"
      feature_type: "boolean" | "number" | "text"
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
      billing_cycle: ["monthly", "yearly", "one-time"],
      content_status: ["draft", "published", "archived"],
      content_type: ["movie", "series", "documentary", "short", "trailer"],
      feature_type: ["boolean", "number", "text"],
    },
  },
} as const
