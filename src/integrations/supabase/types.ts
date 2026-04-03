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
      account_suspensions: {
        Row: {
          expires_at: string | null
          id: string
          is_active: boolean
          lifted_at: string | null
          lifted_by: string | null
          reason: string
          suspended_at: string
          suspended_by: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          is_active?: boolean
          lifted_at?: string | null
          lifted_by?: string | null
          reason: string
          suspended_at?: string
          suspended_by?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          is_active?: boolean
          lifted_at?: string | null
          lifted_by?: string | null
          reason?: string
          suspended_at?: string
          suspended_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ad_rewards: {
        Row: {
          ads_watched: number
          created_at: string
          id: string
          reward_date: string
          total_earned: number
          user_id: string
        }
        Insert: {
          ads_watched?: number
          created_at?: string
          id?: string
          reward_date?: string
          total_earned?: number
          user_id: string
        }
        Update: {
          ads_watched?: number
          created_at?: string
          id?: string
          reward_date?: string
          total_earned?: number
          user_id?: string
        }
        Relationships: []
      }
      ad_videos: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          thumbnail_url: string | null
          title: string
          video_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          thumbnail_url?: string | null
          title: string
          video_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          thumbnail_url?: string | null
          title?: string
          video_url?: string
        }
        Relationships: []
      }
      badge_definitions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          requirement_type: string
          requirement_value?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
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
      blog_comments: {
        Row: {
          blog_id: string
          comment: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          blog_id: string
          comment: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          blog_id?: string
          comment?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_reactions: {
        Row: {
          blog_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          blog_id: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          blog_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_reactions_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
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
      booster_purchases: {
        Row: {
          booster_tier_id: string
          expires_at: string
          id: string
          is_active: boolean
          payment_method: string
          payment_status: string
          price_paid: number
          purchased_at: string
          rate_per_song: number
          user_id: string
        }
        Insert: {
          booster_tier_id: string
          expires_at: string
          id?: string
          is_active?: boolean
          payment_method?: string
          payment_status?: string
          price_paid: number
          purchased_at?: string
          rate_per_song: number
          user_id: string
        }
        Update: {
          booster_tier_id?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          payment_method?: string
          payment_status?: string
          price_paid?: number
          purchased_at?: string
          rate_per_song?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booster_purchases_booster_tier_id_fkey"
            columns: ["booster_tier_id"]
            isOneToOne: false
            referencedRelation: "booster_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      booster_tiers: {
        Row: {
          created_at: string
          duration_hours: number
          id: string
          is_active: boolean
          name: string
          price: number
          rate_per_song: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          duration_hours: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          rate_per_song: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          duration_hours?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          rate_per_song?: number
          sort_order?: number
        }
        Relationships: []
      }
      community_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          image_url: string | null
          message: string | null
          reply_to_id: string | null
          user_avatar: string | null
          user_id: string
          user_name: string
          voice_duration: number | null
          voice_url: string | null
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          message?: string | null
          reply_to_id?: string | null
          user_avatar?: string | null
          user_id: string
          user_name: string
          voice_duration?: number | null
          voice_url?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          message?: string | null
          reply_to_id?: string | null
          user_avatar?: string | null
          user_id?: string
          user_name?: string
          voice_duration?: number | null
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_bonuses: {
        Row: {
          bonus_amount: number
          bonus_date: string
          created_at: string
          id: string
          songs_counted: number
          tier_reached: number
          user_id: string
        }
        Insert: {
          bonus_amount?: number
          bonus_date?: string
          created_at?: string
          id?: string
          songs_counted?: number
          tier_reached?: number
          user_id: string
        }
        Update: {
          bonus_amount?: number
          bonus_date?: string
          created_at?: string
          id?: string
          songs_counted?: number
          tier_reached?: number
          user_id?: string
        }
        Relationships: []
      }
      device_fingerprints: {
        Row: {
          created_at: string
          fingerprint: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          fingerprint: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          fingerprint?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
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
      listening_history: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          play_duration_seconds: number
          reward_amount: number
          reward_given: boolean
          song_duration_seconds: number
          song_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          play_duration_seconds?: number
          reward_amount?: number
          reward_given?: boolean
          song_duration_seconds?: number
          song_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          play_duration_seconds?: number
          reward_amount?: number
          reward_given?: boolean
          song_duration_seconds?: number
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listening_history_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_messages: {
        Row: {
          created_at: string
          id: string
          is_pinned: boolean
          message: string
          session_id: string
          user_avatar: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          message: string
          session_id: string
          user_avatar?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          message?: string
          session_id?: string
          user_avatar?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_reactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          artist_name: string
          created_at: string
          created_by: string | null
          ended_at: string | null
          id: string
          recording_url: string | null
          scheduled_for: string | null
          started_at: string | null
          status: string
          thumbnail_url: string | null
          title: string
          viewer_count: number
        }
        Insert: {
          artist_name?: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          recording_url?: string | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          viewer_count?: number
        }
        Update: {
          artist_name?: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          recording_url?: string | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          viewer_count?: number
        }
        Relationships: []
      }
      login_activity: {
        Row: {
          id: string
          ip_address: string | null
          is_suspicious: boolean
          login_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean
          login_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean
          login_at?: string
          user_agent?: string | null
          user_id?: string
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
      player_themes: {
        Row: {
          accent_color: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          overlay_color: string | null
          sort_order: number | null
          wallpaper_url: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          overlay_color?: string | null
          sort_order?: number | null
          wallpaper_url: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          overlay_color?: string | null
          sort_order?: number | null
          wallpaper_url?: string
        }
        Relationships: []
      }
      playlist_songs: {
        Row: {
          added_at: string | null
          id: string
          playlist_id: string
          song_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          playlist_id: string
          song_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          playlist_id?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_songs_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          user_id?: string
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
      private_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          receiver_id: string
          sender_id: string
          song_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          receiver_id: string
          sender_id: string
          song_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          receiver_id?: string
          sender_id?: string
          song_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promoted_songs: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          promoted_by: string | null
          promotion_type: string
          song_id: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          promoted_by?: string | null
          promotion_type?: string
          song_id: string
          start_date?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          promoted_by?: string | null
          promotion_type?: string
          song_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoted_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_amount: number
          bonus_paid: boolean
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referred_songs_count: number
          referrer_id: string
        }
        Insert: {
          bonus_amount?: number
          bonus_paid?: boolean
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referred_songs_count?: number
          referrer_id: string
        }
        Update: {
          bonus_amount?: number
          bonus_paid?: boolean
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referred_songs_count?: number
          referrer_id?: string
        }
        Relationships: []
      }
      registration_payments: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          mpesa_code: string
          status: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          mpesa_code: string
          status?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          mpesa_code?: string
          status?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      security_flags: {
        Row: {
          created_at: string
          description: string | null
          flag_type: string
          id: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          flag_type: string
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          flag_type?: string
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      share_boosts: {
        Row: {
          boost_expiry: string
          created_at: string
          id: string
          share_date: string
          user_id: string
        }
        Insert: {
          boost_expiry?: string
          created_at?: string
          id?: string
          share_date?: string
          user_id: string
        }
        Update: {
          boost_expiry?: string
          created_at?: string
          id?: string
          share_date?: string
          user_id?: string
        }
        Relationships: []
      }
      short_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          short_id: string
          user_avatar: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          short_id: string
          user_avatar?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          short_id?: string
          user_avatar?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "short_comments_short_id_fkey"
            columns: ["short_id"]
            isOneToOne: false
            referencedRelation: "shorts"
            referencedColumns: ["id"]
          },
        ]
      }
      short_likes: {
        Row: {
          created_at: string
          id: string
          short_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          short_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          short_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "short_likes_short_id_fkey"
            columns: ["short_id"]
            isOneToOne: false
            referencedRelation: "shorts"
            referencedColumns: ["id"]
          },
        ]
      }
      shorts: {
        Row: {
          comment_count: number
          created_at: string
          description: string | null
          id: string
          like_count: number
          published: boolean
          thumbnail_url: string | null
          title: string
          uploaded_by: string | null
          video_url: string
          view_count: number
        }
        Insert: {
          comment_count?: number
          created_at?: string
          description?: string | null
          id?: string
          like_count?: number
          published?: boolean
          thumbnail_url?: string | null
          title: string
          uploaded_by?: string | null
          video_url: string
          view_count?: number
        }
        Update: {
          comment_count?: number
          created_at?: string
          description?: string | null
          id?: string
          like_count?: number
          published?: boolean
          thumbnail_url?: string | null
          title?: string
          uploaded_by?: string | null
          video_url?: string
          view_count?: number
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
      song_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          song_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          song_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_ratings_song_id_fkey"
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
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_earnings: {
        Row: {
          balance: number
          created_at: string
          id: string
          last_listen_date: string | null
          referral_code: string | null
          songs_listened_today: number
          total_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          last_listen_date?: string | null
          referral_code?: string | null
          songs_listened_today?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          last_listen_date?: string | null
          referral_code?: string | null
          songs_listened_today?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          created_at: string
          id: string
          last_activity_date: string | null
          level: string
          points: number
          streak_days: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity_date?: string | null
          level?: string
          points?: number
          streak_days?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_activity_date?: string | null
          level?: string
          points?: number
          streak_days?: number
          updated_at?: string
          user_id?: string
          xp?: number
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
      user_theme_preferences: {
        Row: {
          created_at: string | null
          custom_wallpaper_url: string | null
          id: string
          theme_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_wallpaper_url?: string | null
          id?: string
          theme_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_wallpaper_url?: string | null
          id?: string
          theme_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_theme_preferences_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "player_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          payment_details: string | null
          payment_method: string
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_details?: string | null
          payment_method?: string
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_details?: string | null
          payment_method?: string
          processed_at?: string | null
          status?: string
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
      award_points: {
        Args: { _action: string; _points: number; _user_id: string }
        Returns: Json
      }
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
      increment_short_view: { Args: { _short_id: string }; Returns: undefined }
      increment_song_view: {
        Args: { _song_id: string; _view_date?: string }
        Returns: undefined
      }
      increment_video_view: { Args: { _video_id: string }; Returns: undefined }
      is_admin: { Args: { pin: string }; Returns: boolean }
      is_registered_user: { Args: { _user_id: string }; Returns: boolean }
      process_listen_reward: {
        Args: {
          _play_duration: number
          _song_duration: number
          _song_id: string
          _user_id: string
        }
        Returns: Json
      }
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
