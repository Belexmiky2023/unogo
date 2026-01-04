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
      admin_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_themes: {
        Row: {
          id: string
          is_default: boolean
          name: string
          required_xp: number
          theme_data: Json
        }
        Insert: {
          id?: string
          is_default?: boolean
          name: string
          required_xp?: number
          theme_data?: Json
        }
        Update: {
          id?: string
          is_default?: boolean
          name?: string
          required_xp?: number
          theme_data?: Json
        }
        Relationships: []
      }
      challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          end_date: string | null
          id: string
          is_active: boolean
          requirement_type: string
          requirement_value: number
          start_date: string | null
          title: string
          xp_reward: number
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          requirement_type: string
          requirement_value?: number
          start_date?: string | null
          title: string
          xp_reward?: number
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          requirement_type?: string
          requirement_value?: number
          start_date?: string | null
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          requirement_value: number
          task_type: string
          title: string
          valid_date: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          requirement_value?: number
          task_type: string
          title: string
          valid_date?: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          requirement_value?: number
          task_type?: string
          title?: string
          valid_date?: string
          xp_reward?: number
        }
        Relationships: []
      }
      event_rewards: {
        Row: {
          created_at: string
          event_id: string
          id: string
          reward_data: Json
          reward_type: string
          xp_required: number
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          reward_data?: Json
          reward_type: string
          xp_required?: number
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          reward_data?: Json
          reward_type?: string
          xp_required?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_rewards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "seasonal_events"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_invites: {
        Row: {
          created_at: string
          from_profile_id: string
          game_id: string
          id: string
          status: string
          to_profile_id: string
        }
        Insert: {
          created_at?: string
          from_profile_id: string
          game_id: string
          id?: string
          status?: string
          to_profile_id: string
        }
        Update: {
          created_at?: string
          from_profile_id?: string
          game_id?: string
          id?: string
          status?: string
          to_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_invites_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_invites_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_invites_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_messages: {
        Row: {
          created_at: string
          game_id: string
          id: string
          message: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          message: string
          profile_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          message?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_messages_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_messages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          ai_name: string | null
          created_at: string
          game_id: string
          hand: Json
          has_called_uno: boolean
          id: string
          is_active: boolean
          is_ai: boolean
          player_index: number
          profile_id: string | null
        }
        Insert: {
          ai_name?: string | null
          created_at?: string
          game_id: string
          hand?: Json
          has_called_uno?: boolean
          id?: string
          is_active?: boolean
          is_ai?: boolean
          player_index: number
          profile_id?: string | null
        }
        Update: {
          ai_name?: string | null
          created_at?: string
          game_id?: string
          hand?: Json
          has_called_uno?: boolean
          id?: string
          is_active?: boolean
          is_ai?: boolean
          player_index?: number
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          current_color: string | null
          current_player_index: number
          direction: number
          discard_pile: Json
          draw_pile: Json
          game_type: string
          id: string
          status: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          current_color?: string | null
          current_player_index?: number
          direction?: number
          discard_pile?: Json
          draw_pile?: Json
          game_type: string
          id?: string
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          current_color?: string | null
          current_player_index?: number
          direction?: number
          discard_pile?: Json
          draw_pile?: Json
          game_type?: string
          id?: string
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matchmaking_queue: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchmaking_queue_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      online_status: {
        Row: {
          is_online: boolean
          last_seen: string
          profile_id: string
        }
        Insert: {
          is_online?: boolean
          last_seen?: string
          profile_id: string
        }
        Update: {
          is_online?: boolean
          last_seen?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_status_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          created_at: string
          display_name: string | null
          games_played: number
          id: string
          is_banned: boolean
          is_verified: boolean
          losses: number
          referral_code: string | null
          selected_theme: string | null
          updated_at: string
          user_id: string
          username: string
          wins: number
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          created_at?: string
          display_name?: string | null
          games_played?: number
          id?: string
          is_banned?: boolean
          is_verified?: boolean
          losses?: number
          referral_code?: string | null
          selected_theme?: string | null
          updated_at?: string
          user_id: string
          username: string
          wins?: number
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          created_at?: string
          display_name?: string | null
          games_played?: number
          id?: string
          is_banned?: boolean
          is_verified?: boolean
          losses?: number
          referral_code?: string | null
          selected_theme?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          wins?: number
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_selected_theme_fkey"
            columns: ["selected_theme"]
            isOneToOne: false
            referencedRelation: "card_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      ranks: {
        Row: {
          badge_color: string
          icon: string
          id: string
          min_xp: number
          name: string
        }
        Insert: {
          badge_color: string
          icon: string
          id?: string
          min_xp: number
          name: string
        }
        Update: {
          badge_color?: string
          icon?: string
          id?: string
          min_xp?: number
          name?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          xp_rewarded: number
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          xp_rewarded?: number
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          xp_rewarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reserved_usernames: {
        Row: {
          id: string
          username: string
        }
        Insert: {
          id?: string
          username: string
        }
        Update: {
          id?: string
          username?: string
        }
        Relationships: []
      }
      seasonal_events: {
        Row: {
          banner_image: string | null
          created_at: string
          description: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          start_date: string
          theme_color: string
        }
        Insert: {
          banner_image?: string | null
          created_at?: string
          description: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          start_date: string
          theme_color?: string
        }
        Update: {
          banner_image?: string | null
          created_at?: string
          description?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          theme_color?: string
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          current_progress: number
          id: string
          is_completed: boolean
          profile_id: string
          xp_claimed: boolean
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean
          profile_id: string
          xp_claimed?: boolean
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean
          profile_id?: string
          xp_claimed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          current_progress: number
          id: string
          is_completed: boolean
          profile_id: string
          task_id: string
          xp_claimed: boolean
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean
          profile_id: string
          task_id: string
          xp_claimed?: boolean
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean
          profile_id?: string
          task_id?: string
          xp_claimed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_tasks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_daily_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_event_progress: {
        Row: {
          created_at: string
          event_id: string
          event_xp: number
          id: string
          profile_id: string
          rewards_claimed: Json
        }
        Insert: {
          created_at?: string
          event_id: string
          event_xp?: number
          id?: string
          profile_id: string
          rewards_claimed?: Json
        }
        Update: {
          created_at?: string
          event_id?: string
          event_xp?: number
          id?: string
          profile_id?: string
          rewards_claimed?: Json
        }
        Relationships: [
          {
            foreignKeyName: "user_event_progress_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "seasonal_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_event_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_username_suggestions: {
        Args: { base_name: string }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_username_available: {
        Args: { check_username: string }
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
