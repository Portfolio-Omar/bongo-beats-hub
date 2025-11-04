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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      blog_categories: {
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
      blog_category_relations: {
        Row: {
          blog_id: string
          category_id: string
        }
        Insert: {
          blog_id: string
          category_id: string
        }
        Update: {
          blog_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_category_relations_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_category_relations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          author: string | null
          content: string
          created_at: string
          date: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          rich_content: Json | null
          slug: string | null
          status: string
          tags: string[] | null
          title: string
        }
        Insert: {
          author?: string | null
          content: string
          created_at?: string
          date: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          rich_content?: Json | null
          slug?: string | null
          status: string
          tags?: string[] | null
          title: string
        }
        Update: {
          author?: string | null
          content?: string
          created_at?: string
          date?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          rich_content?: Json | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          song_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          song_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          date: string
          email: string
          feedback: string
          id: string
          name: string
          read: boolean | null
        }
        Insert: {
          date: string
          email: string
          feedback: string
          id?: string
          name: string
          read?: boolean | null
        }
        Update: {
          date?: string
          email?: string
          feedback?: string
          id?: string
          name?: string
          read?: boolean | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          date: string
          email: string
          id: string
          message: string
          name: string
          read: boolean | null
          subject: string
        }
        Insert: {
          created_at?: string
          date: string
          email: string
          id?: string
          message: string
          name: string
          read?: boolean | null
          subject: string
        }
        Update: {
          created_at?: string
          date?: string
          email?: string
          id?: string
          message?: string
          name?: string
          read?: boolean | null
          subject?: string
        }
        Relationships: []
      }
      music_videos: {
        Row: {
          artist: string
          created_at: string
          id: string
          published: boolean | null
          thumbnail_url: string | null
          title: string
          video_url: string
          view_count: number | null
        }
        Insert: {
          artist: string
          created_at?: string
          id?: string
          published?: boolean | null
          thumbnail_url?: string | null
          title: string
          video_url: string
          view_count?: number | null
        }
        Update: {
          artist?: string
          created_at?: string
          id?: string
          published?: boolean | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string
          view_count?: number | null
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          created_at: string
          id: string
          poll_id: string | null
          text: string
          votes: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          poll_id?: string | null
          text: string
          votes?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          poll_id?: string | null
          text?: string
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          description: string
          end_date: string
          id: string
          participants: number | null
          start_date: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          end_date: string
          id?: string
          participants?: number | null
          start_date: string
          status: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          end_date?: string
          id?: string
          participants?: number | null
          start_date?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      song_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          name: string
          song_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          name: string
          song_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          name?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_comments_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_of_the_week: {
        Row: {
          active: boolean | null
          feature_date: string | null
          id: string
          song_id: string
        }
        Insert: {
          active?: boolean | null
          feature_date?: string | null
          id?: string
          song_id: string
        }
        Update: {
          active?: boolean | null
          feature_date?: string | null
          id?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_of_the_week_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_reactions: {
        Row: {
          created_at: string | null
          id: string
          name: string
          reaction_type: string
          song_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          reaction_type: string
          song_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          reaction_type?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_reactions_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_requests: {
        Row: {
          admin_notes: string | null
          artist_name: string
          audio_url: string
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          song_name: string
          status: string
          submitted_by_email: string | null
          submitted_by_name: string | null
        }
        Insert: {
          admin_notes?: string | null
          artist_name: string
          audio_url: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          song_name: string
          status?: string
          submitted_by_email?: string | null
          submitted_by_name?: string | null
        }
        Update: {
          admin_notes?: string | null
          artist_name?: string
          audio_url?: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          song_name?: string
          status?: string
          submitted_by_email?: string | null
          submitted_by_name?: string | null
        }
        Relationships: []
      }
      song_view_stats: {
        Row: {
          id: string
          song_id: string
          view_count: number
          view_date: string
        }
        Insert: {
          id?: string
          song_id: string
          view_count?: number
          view_date?: string
        }
        Update: {
          id?: string
          song_id?: string
          view_count?: number
          view_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_view_stats_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          artist: string
          audio_url: string
          cover_url: string | null
          created_at: string
          download_count: number | null
          duration: string | null
          genre: string | null
          id: string
          published: boolean | null
          title: string
          year: string | null
        }
        Insert: {
          artist: string
          audio_url: string
          cover_url?: string | null
          created_at?: string
          download_count?: number | null
          duration?: string | null
          genre?: string | null
          id?: string
          published?: boolean | null
          title: string
          year?: string | null
        }
        Update: {
          artist?: string
          audio_url?: string
          cover_url?: string | null
          created_at?: string
          download_count?: number | null
          duration?: string | null
          genre?: string | null
          id?: string
          published?: boolean | null
          title?: string
          year?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_login: { Args: { pin: string }; Returns: boolean }
      check_admin: { Args: never; Returns: boolean }
      check_song_exists: {
        Args: { _artist: string; _title: string }
        Returns: boolean
      }
      generate_slug: { Args: { title: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_song_view: {
        Args: { _song_id: string; _view_date?: string }
        Returns: undefined
      }
      increment_video_view: { Args: { _video_id: string }; Returns: undefined }
      is_admin: { Args: { pin: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
