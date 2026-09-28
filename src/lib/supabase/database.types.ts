/**
 * Hand-maintained mirror of supabase/migrations/*.sql.
 * Replace with `supabase gen types typescript` output once a live project
 * exists — keep this file in sync with every migration until then.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          headline: string | null;
          bio: string | null;
          avatar_url: string | null;
          specialization: string | null;
          skills: string[];
          work_languages: string[];
          country: string | null;
          rate_min: number | null;
          rate_max: number | null;
          rate_currency: string;
          rate_unit: "hour" | "project" | null;
          available_for_work: boolean;
          contacts: Json;
          theme: "light" | "dark" | "system";
          accent_color: string;
          ui_locale: string;
          plan: "free" | "pro";
          role: "user" | "admin";
          status: "active" | "hidden" | "banned";
          email_verified: boolean;
          username_changed_at: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      works: {
        Row: {
          id: string;
          profile_id: string;
          slug: string;
          position: number;
          source_url: string | null;
          source_type:
            | "website" | "figma" | "github" | "youtube" | "vimeo" | "loom"
            | "google_doc" | "google_slides" | "notion" | "telegram_post"
            | "behance" | "dribbble" | "upload_image" | "upload_video" | "upload_pdf" | "other";
          render_mode: "live_iframe" | "embed" | "github_card" | "screenshot" | "video" | "pdf" | "gallery";
          embed_url: string | null;
          title: string | null;
          description: string | null;
          result: string | null;
          category: string | null;
          tags: string[];
          cover_url: string | null;
          cover_source: "custom" | "og" | "screenshot" | null;
          screenshot_url: string | null;
          meta: Json;
          iframe_allowed: boolean;
          ingest_status: "pending" | "processing" | "ready" | "failed";
          safety_status: "pending" | "safe" | "unsafe";
          moderation_status: "pending" | "approved" | "flagged" | "rejected";
          is_broken: boolean;
          last_checked_at: string | null;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["works"]["Row"]> & {
          profile_id: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["works"]["Row"]>;
        Relationships: [];
      };
      work_files: {
        Row: {
          id: string;
          work_id: string;
          storage_path: string;
          mime: string;
          size_bytes: number;
          kind: "image" | "video" | "pdf";
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["work_files"]["Row"]> & {
          work_id: string;
          storage_path: string;
          mime: string;
          size_bytes: number;
          kind: "image" | "video" | "pdf";
        };
        Update: Partial<Database["public"]["Tables"]["work_files"]["Row"]>;
        Relationships: [];
      };
      hire_requests: {
        Row: {
          id: string;
          profile_id: string;
          work_id: string | null;
          name: string;
          email: string;
          budget: string | null;
          message: string;
          locale: string;
          status: "new" | "read" | "archived" | "spam";
          ip_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["hire_requests"]["Row"]> & {
          profile_id: string;
          name: string;
          email: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["hire_requests"]["Row"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: number;
          profile_id: string;
          work_id: string | null;
          type:
            | "profile_view" | "work_expand" | "work_open_external"
            | "hire_click" | "hire_submit" | "contact_click";
          contact_type: string | null;
          visitor_hash: string;
          referrer_host: string | null;
          country: string | null;
          device: "desktop" | "tablet" | "mobile" | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["events"]["Row"]> & {
          profile_id: string;
          type: Database["public"]["Tables"]["events"]["Row"]["type"];
          visitor_hash: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          target_type: "profile" | "work";
          target_id: string;
          reason: "spam" | "nsfw" | "scam" | "copyright" | "offensive" | "other";
          details: string | null;
          reporter_email: string | null;
          reporter_hash: string | null;
          status: "open" | "resolved" | "dismissed";
          resolved_by: string | null;
          resolution_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reports"]["Row"]> & {
          target_type: "profile" | "work";
          target_id: string;
          reason: Database["public"]["Tables"]["reports"]["Row"]["reason"];
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Row"]>;
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          type: "ingest_work" | "recheck_link" | "refresh_screenshot" | "moderate";
          payload: Json;
          status: "queued" | "running" | "done" | "failed";
          attempts: number;
          run_after: string;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["jobs"]["Row"]> & {
          type: Database["public"]["Tables"]["jobs"]["Row"]["type"];
          payload: Json;
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Row"]>;
        Relationships: [];
      };
      moderation_log: {
        Row: {
          id: string;
          actor_id: string | null;
          target_type: string;
          target_id: string;
          action: string;
          note: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["moderation_log"]["Row"]> & {
          target_type: string;
          target_id: string;
          action: string;
        };
        Update: Partial<Database["public"]["Tables"]["moderation_log"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      catalog_profiles: {
        Row: Database["public"]["Tables"]["profiles"]["Row"];
        Relationships: [];
      };
    };
    Functions: {
      claim_jobs: {
        Args: { p_limit: number };
        Returns: Database["public"]["Tables"]["jobs"]["Row"][];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
