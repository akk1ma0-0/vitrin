/**
 * Generated via `mcp__Supabase__generate_typescript_types` (equivalent to
 * `supabase gen types typescript --project-id qptcfmhxaopqlnritugm`, also
 * available as `npm run gen:types`) against the live project, now that real
 * migrations exist. Do not hand-edit — regenerate after every migration.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      events: {
        Row: {
          contact_type: string | null;
          country: string | null;
          created_at: string;
          device: Database["public"]["Enums"]["device_type"] | null;
          id: number;
          profile_id: string;
          referrer_host: string | null;
          type: Database["public"]["Enums"]["event_type"];
          visitor_hash: string;
          work_id: string | null;
        };
        Insert: {
          contact_type?: string | null;
          country?: string | null;
          created_at?: string;
          device?: Database["public"]["Enums"]["device_type"] | null;
          id?: number;
          profile_id: string;
          referrer_host?: string | null;
          type: Database["public"]["Enums"]["event_type"];
          visitor_hash: string;
          work_id?: string | null;
        };
        Update: {
          contact_type?: string | null;
          country?: string | null;
          created_at?: string;
          device?: Database["public"]["Enums"]["device_type"] | null;
          id?: number;
          profile_id?: string;
          referrer_host?: string | null;
          type?: Database["public"]["Enums"]["event_type"];
          visitor_hash?: string;
          work_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "catalog_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id"];
          },
        ];
      };
      hire_requests: {
        Row: {
          budget: string | null;
          created_at: string;
          email: string;
          id: string;
          ip_hash: string | null;
          locale: string;
          message: string;
          name: string;
          profile_id: string;
          status: Database["public"]["Enums"]["hire_request_status"];
          updated_at: string;
          work_id: string | null;
        };
        Insert: {
          budget?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          ip_hash?: string | null;
          locale?: string;
          message: string;
          name: string;
          profile_id: string;
          status?: Database["public"]["Enums"]["hire_request_status"];
          updated_at?: string;
          work_id?: string | null;
        };
        Update: {
          budget?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          ip_hash?: string | null;
          locale?: string;
          message?: string;
          name?: string;
          profile_id?: string;
          status?: Database["public"]["Enums"]["hire_request_status"];
          updated_at?: string;
          work_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "hire_requests_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "catalog_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hire_requests_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hire_requests_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          attempts: number;
          created_at: string;
          id: string;
          last_error: string | null;
          payload: Json;
          run_after: string;
          status: Database["public"]["Enums"]["job_status"];
          type: Database["public"]["Enums"]["job_type"];
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          payload?: Json;
          run_after?: string;
          status?: Database["public"]["Enums"]["job_status"];
          type: Database["public"]["Enums"]["job_type"];
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          payload?: Json;
          run_after?: string;
          status?: Database["public"]["Enums"]["job_status"];
          type?: Database["public"]["Enums"]["job_type"];
          updated_at?: string;
        };
        Relationships: [];
      };
      moderation_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          id: string;
          note: string | null;
          target_id: string;
          target_type: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          note?: string | null;
          target_id: string;
          target_type: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          note?: string | null;
          target_id?: string;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "catalog_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moderation_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          accent_color: string;
          available_for_work: boolean;
          avatar_url: string | null;
          bio: string | null;
          contacts: Json;
          country: string | null;
          created_at: string;
          display_name: string | null;
          email_verified: boolean;
          headline: string | null;
          id: string;
          onboarding_completed: boolean;
          plan: Database["public"]["Enums"]["plan_type"];
          rate_currency: string;
          rate_max: number | null;
          rate_min: number | null;
          rate_unit: Database["public"]["Enums"]["rate_unit"] | null;
          role: Database["public"]["Enums"]["user_role"];
          search_vector: unknown;
          skills: string[];
          specialization: string | null;
          status: Database["public"]["Enums"]["profile_status"];
          telegram_id: number | null;
          theme: Database["public"]["Enums"]["theme_pref"];
          ui_locale: string;
          updated_at: string;
          username: string | null;
          username_changed_at: string | null;
          work_languages: string[];
        };
        Insert: {
          accent_color?: string;
          available_for_work?: boolean;
          avatar_url?: string | null;
          bio?: string | null;
          contacts?: Json;
          country?: string | null;
          created_at?: string;
          display_name?: string | null;
          email_verified?: boolean;
          headline?: string | null;
          id: string;
          onboarding_completed?: boolean;
          plan?: Database["public"]["Enums"]["plan_type"];
          rate_currency?: string;
          rate_max?: number | null;
          rate_min?: number | null;
          rate_unit?: Database["public"]["Enums"]["rate_unit"] | null;
          role?: Database["public"]["Enums"]["user_role"];
          search_vector?: unknown;
          skills?: string[];
          specialization?: string | null;
          status?: Database["public"]["Enums"]["profile_status"];
          telegram_id?: number | null;
          theme?: Database["public"]["Enums"]["theme_pref"];
          ui_locale?: string;
          updated_at?: string;
          username?: string | null;
          username_changed_at?: string | null;
          work_languages?: string[];
        };
        Update: {
          accent_color?: string;
          available_for_work?: boolean;
          avatar_url?: string | null;
          bio?: string | null;
          contacts?: Json;
          country?: string | null;
          created_at?: string;
          display_name?: string | null;
          email_verified?: boolean;
          headline?: string | null;
          id?: string;
          onboarding_completed?: boolean;
          plan?: Database["public"]["Enums"]["plan_type"];
          rate_currency?: string;
          rate_max?: number | null;
          rate_min?: number | null;
          rate_unit?: Database["public"]["Enums"]["rate_unit"] | null;
          role?: Database["public"]["Enums"]["user_role"];
          search_vector?: unknown;
          skills?: string[];
          specialization?: string | null;
          status?: Database["public"]["Enums"]["profile_status"];
          telegram_id?: number | null;
          theme?: Database["public"]["Enums"]["theme_pref"];
          ui_locale?: string;
          updated_at?: string;
          username?: string | null;
          username_changed_at?: string | null;
          work_languages?: string[];
        };
        Relationships: [];
      };
      reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          reason: Database["public"]["Enums"]["report_reason"];
          reporter_email: string | null;
          reporter_hash: string | null;
          resolution_note: string | null;
          resolved_by: string | null;
          status: Database["public"]["Enums"]["report_status"];
          target_id: string;
          target_type: Database["public"]["Enums"]["report_target_type"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason: Database["public"]["Enums"]["report_reason"];
          reporter_email?: string | null;
          reporter_hash?: string | null;
          resolution_note?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          target_id: string;
          target_type: Database["public"]["Enums"]["report_target_type"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason?: Database["public"]["Enums"]["report_reason"];
          reporter_email?: string | null;
          reporter_hash?: string | null;
          resolution_note?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          target_id?: string;
          target_type?: Database["public"]["Enums"]["report_target_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "catalog_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      work_files: {
        Row: {
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["file_kind"];
          mime: string;
          position: number;
          size_bytes: number;
          storage_path: string;
          updated_at: string;
          work_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: Database["public"]["Enums"]["file_kind"];
          mime: string;
          position?: number;
          size_bytes: number;
          storage_path: string;
          updated_at?: string;
          work_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["file_kind"];
          mime?: string;
          position?: number;
          size_bytes?: number;
          storage_path?: string;
          updated_at?: string;
          work_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_files_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id"];
          },
        ];
      };
      works: {
        Row: {
          category: string | null;
          cover_source: Database["public"]["Enums"]["cover_source"] | null;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          embed_url: string | null;
          id: string;
          iframe_allowed: boolean;
          ingest_status: Database["public"]["Enums"]["ingest_status"];
          is_broken: boolean;
          is_hidden: boolean;
          last_checked_at: string | null;
          meta: Json;
          moderation_status: Database["public"]["Enums"]["moderation_status"];
          position: number;
          profile_id: string;
          render_mode: Database["public"]["Enums"]["render_mode"];
          result: string | null;
          safety_status: Database["public"]["Enums"]["safety_status"];
          screenshot_url: string | null;
          slug: string;
          source_type: Database["public"]["Enums"]["source_type"];
          source_url: string | null;
          tags: string[];
          title: string | null;
          updated_at: string;
        };
        Insert: {
          category?: string | null;
          cover_source?: Database["public"]["Enums"]["cover_source"] | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          embed_url?: string | null;
          id?: string;
          iframe_allowed?: boolean;
          ingest_status?: Database["public"]["Enums"]["ingest_status"];
          is_broken?: boolean;
          is_hidden?: boolean;
          last_checked_at?: string | null;
          meta?: Json;
          moderation_status?: Database["public"]["Enums"]["moderation_status"];
          position?: number;
          profile_id: string;
          render_mode?: Database["public"]["Enums"]["render_mode"];
          result?: string | null;
          safety_status?: Database["public"]["Enums"]["safety_status"];
          screenshot_url?: string | null;
          slug: string;
          source_type?: Database["public"]["Enums"]["source_type"];
          source_url?: string | null;
          tags?: string[];
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          category?: string | null;
          cover_source?: Database["public"]["Enums"]["cover_source"] | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          embed_url?: string | null;
          id?: string;
          iframe_allowed?: boolean;
          ingest_status?: Database["public"]["Enums"]["ingest_status"];
          is_broken?: boolean;
          is_hidden?: boolean;
          last_checked_at?: string | null;
          meta?: Json;
          moderation_status?: Database["public"]["Enums"]["moderation_status"];
          position?: number;
          profile_id?: string;
          render_mode?: Database["public"]["Enums"]["render_mode"];
          result?: string | null;
          safety_status?: Database["public"]["Enums"]["safety_status"];
          screenshot_url?: string | null;
          slug?: string;
          source_type?: Database["public"]["Enums"]["source_type"];
          source_url?: string | null;
          tags?: string[];
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "works_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "catalog_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "works_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      catalog_profiles: {
        Row: {
          accent_color: string | null;
          available_for_work: boolean | null;
          avatar_url: string | null;
          bio: string | null;
          contacts: Json | null;
          country: string | null;
          created_at: string | null;
          display_name: string | null;
          email_verified: boolean | null;
          headline: string | null;
          id: string | null;
          onboarding_completed: boolean | null;
          plan: Database["public"]["Enums"]["plan_type"] | null;
          rate_currency: string | null;
          rate_max: number | null;
          rate_min: number | null;
          rate_unit: Database["public"]["Enums"]["rate_unit"] | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          search_vector: unknown;
          skills: string[] | null;
          specialization: string | null;
          status: Database["public"]["Enums"]["profile_status"] | null;
          telegram_id: number | null;
          theme: Database["public"]["Enums"]["theme_pref"] | null;
          ui_locale: string | null;
          updated_at: string | null;
          username: string | null;
          username_changed_at: string | null;
          work_languages: string[] | null;
        };
        Insert: {
          accent_color?: string | null;
          available_for_work?: boolean | null;
          avatar_url?: string | null;
          bio?: string | null;
          contacts?: Json | null;
          country?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          email_verified?: boolean | null;
          headline?: string | null;
          id?: string | null;
          onboarding_completed?: boolean | null;
          plan?: Database["public"]["Enums"]["plan_type"] | null;
          rate_currency?: string | null;
          rate_max?: number | null;
          rate_min?: number | null;
          rate_unit?: Database["public"]["Enums"]["rate_unit"] | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          search_vector?: unknown;
          skills?: string[] | null;
          specialization?: string | null;
          status?: Database["public"]["Enums"]["profile_status"] | null;
          telegram_id?: number | null;
          theme?: Database["public"]["Enums"]["theme_pref"] | null;
          ui_locale?: string | null;
          updated_at?: string | null;
          username?: string | null;
          username_changed_at?: string | null;
          work_languages?: string[] | null;
        };
        Update: {
          accent_color?: string | null;
          available_for_work?: boolean | null;
          avatar_url?: string | null;
          bio?: string | null;
          contacts?: Json | null;
          country?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          email_verified?: boolean | null;
          headline?: string | null;
          id?: string | null;
          onboarding_completed?: boolean | null;
          plan?: Database["public"]["Enums"]["plan_type"] | null;
          rate_currency?: string | null;
          rate_max?: number | null;
          rate_min?: number | null;
          rate_unit?: Database["public"]["Enums"]["rate_unit"] | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          search_vector?: unknown;
          skills?: string[] | null;
          specialization?: string | null;
          status?: Database["public"]["Enums"]["profile_status"] | null;
          telegram_id?: number | null;
          theme?: Database["public"]["Enums"]["theme_pref"] | null;
          ui_locale?: string | null;
          updated_at?: string | null;
          username?: string | null;
          username_changed_at?: string | null;
          work_languages?: string[] | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      catalog_profiles_by_popularity: {
        Args: { available_only?: boolean; filter_specialization?: string };
        Returns: {
          accent_color: string | null;
          available_for_work: boolean | null;
          avatar_url: string | null;
          bio: string | null;
          contacts: Json | null;
          country: string | null;
          created_at: string | null;
          display_name: string | null;
          email_verified: boolean | null;
          headline: string | null;
          id: string | null;
          onboarding_completed: boolean | null;
          plan: Database["public"]["Enums"]["plan_type"] | null;
          rate_currency: string | null;
          rate_max: number | null;
          rate_min: number | null;
          rate_unit: Database["public"]["Enums"]["rate_unit"] | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          search_vector: unknown;
          skills: string[] | null;
          specialization: string | null;
          status: Database["public"]["Enums"]["profile_status"] | null;
          telegram_id: number | null;
          theme: Database["public"]["Enums"]["theme_pref"] | null;
          ui_locale: string | null;
          updated_at: string | null;
          username: string | null;
          username_changed_at: string | null;
          work_languages: string[] | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "catalog_profiles";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      claim_jobs: {
        Args: { p_limit: number };
        Returns: {
          attempts: number;
          created_at: string;
          id: string;
          last_error: string | null;
          payload: Json;
          run_after: string;
          status: Database["public"]["Enums"]["job_status"];
          type: Database["public"]["Enums"]["job_type"];
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "jobs";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      immutable_simple_tsvector: { Args: { input: string }; Returns: unknown };
      immutable_simple_tsvector_from_array: {
        Args: { input: string[] };
        Returns: unknown;
      };
      is_admin: { Args: never; Returns: boolean };
      search_catalog_profiles: {
        Args: {
          available_only?: boolean;
          filter_specialization?: string;
          search_query: string;
          sort_newest?: boolean;
        };
        Returns: {
          accent_color: string | null;
          available_for_work: boolean | null;
          avatar_url: string | null;
          bio: string | null;
          contacts: Json | null;
          country: string | null;
          created_at: string | null;
          display_name: string | null;
          email_verified: boolean | null;
          headline: string | null;
          id: string | null;
          onboarding_completed: boolean | null;
          plan: Database["public"]["Enums"]["plan_type"] | null;
          rate_currency: string | null;
          rate_max: number | null;
          rate_min: number | null;
          rate_unit: Database["public"]["Enums"]["rate_unit"] | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          search_vector: unknown;
          skills: string[] | null;
          specialization: string | null;
          status: Database["public"]["Enums"]["profile_status"] | null;
          telegram_id: number | null;
          theme: Database["public"]["Enums"]["theme_pref"] | null;
          ui_locale: string | null;
          updated_at: string | null;
          username: string | null;
          username_changed_at: string | null;
          work_languages: string[] | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "catalog_profiles";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
    };
    Enums: {
      cover_source: "custom" | "og" | "screenshot";
      device_type: "desktop" | "tablet" | "mobile";
      event_type:
        | "profile_view"
        | "work_expand"
        | "work_open_external"
        | "hire_click"
        | "hire_submit"
        | "contact_click";
      file_kind: "image" | "video" | "pdf";
      hire_request_status: "new" | "read" | "archived" | "spam";
      ingest_status: "pending" | "processing" | "ready" | "failed";
      job_status: "queued" | "running" | "done" | "failed";
      job_type:
        "ingest_work" | "recheck_link" | "refresh_screenshot" | "moderate";
      moderation_status: "pending" | "approved" | "flagged" | "rejected";
      plan_type: "free" | "pro";
      profile_status: "active" | "hidden" | "banned";
      rate_unit: "hour" | "project";
      render_mode:
        | "live_iframe"
        | "embed"
        | "github_card"
        | "screenshot"
        | "video"
        | "pdf"
        | "gallery";
      report_reason:
        "spam" | "nsfw" | "scam" | "copyright" | "offensive" | "other";
      report_status: "open" | "resolved" | "dismissed";
      report_target_type: "profile" | "work";
      safety_status: "pending" | "safe" | "unsafe";
      source_type:
        | "website"
        | "figma"
        | "github"
        | "youtube"
        | "vimeo"
        | "loom"
        | "google_doc"
        | "google_slides"
        | "notion"
        | "telegram_post"
        | "behance"
        | "dribbble"
        | "upload_image"
        | "upload_video"
        | "upload_pdf"
        | "other";
      theme_pref: "light" | "dark" | "system";
      user_role: "user" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      cover_source: ["custom", "og", "screenshot"],
      device_type: ["desktop", "tablet", "mobile"],
      event_type: [
        "profile_view",
        "work_expand",
        "work_open_external",
        "hire_click",
        "hire_submit",
        "contact_click",
      ],
      file_kind: ["image", "video", "pdf"],
      hire_request_status: ["new", "read", "archived", "spam"],
      ingest_status: ["pending", "processing", "ready", "failed"],
      job_status: ["queued", "running", "done", "failed"],
      job_type: [
        "ingest_work",
        "recheck_link",
        "refresh_screenshot",
        "moderate",
      ],
      moderation_status: ["pending", "approved", "flagged", "rejected"],
      plan_type: ["free", "pro"],
      profile_status: ["active", "hidden", "banned"],
      rate_unit: ["hour", "project"],
      render_mode: [
        "live_iframe",
        "embed",
        "github_card",
        "screenshot",
        "video",
        "pdf",
        "gallery",
      ],
      report_reason: [
        "spam",
        "nsfw",
        "scam",
        "copyright",
        "offensive",
        "other",
      ],
      report_status: ["open", "resolved", "dismissed"],
      report_target_type: ["profile", "work"],
      safety_status: ["pending", "safe", "unsafe"],
      source_type: [
        "website",
        "figma",
        "github",
        "youtube",
        "vimeo",
        "loom",
        "google_doc",
        "google_slides",
        "notion",
        "telegram_post",
        "behance",
        "dribbble",
        "upload_image",
        "upload_video",
        "upload_pdf",
        "other",
      ],
      theme_pref: ["light", "dark", "system"],
      user_role: ["user", "admin"],
    },
  },
} as const;
