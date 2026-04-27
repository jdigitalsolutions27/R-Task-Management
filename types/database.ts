export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          company_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          activated_at: string | null;
          background_color: string | null;
          created_at: string;
          first_admin_user_id: string | null;
          id: string;
          invite_approval_required: boolean;
          logo_url: string | null;
          name: string;
          primary_color: string | null;
          secondary_color: string | null;
          slug: string;
          status: Database["public"]["Enums"]["company_status"];
          support_email: string | null;
          support_email_verification_sent_at: string | null;
          support_email_verified_at: string | null;
          updated_at: string;
        };
        Insert: {
          activated_at?: string | null;
          background_color?: string | null;
          created_at?: string;
          first_admin_user_id?: string | null;
          id?: string;
          invite_approval_required?: boolean;
          logo_url?: string | null;
          name: string;
          primary_color?: string | null;
          secondary_color?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["company_status"];
          support_email?: string | null;
          support_email_verification_sent_at?: string | null;
          support_email_verified_at?: string | null;
          updated_at?: string;
        };
        Update: {
          activated_at?: string | null;
          background_color?: string | null;
          created_at?: string;
          first_admin_user_id?: string | null;
          id?: string;
          invite_approval_required?: boolean;
          logo_url?: string | null;
          name?: string;
          primary_color?: string | null;
          secondary_color?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["company_status"];
          support_email?: string | null;
          support_email_verification_sent_at?: string | null;
          support_email_verified_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_access_tokens: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string | null;
          email: string;
          expires_at: string;
          id: string;
          metadata: Json;
          purpose: string;
          token_hash: string;
          used_at: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          email: string;
          expires_at: string;
          id?: string;
          metadata?: Json;
          purpose: string;
          token_hash: string;
          used_at?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          email?: string;
          expires_at?: string;
          id?: string;
          metadata?: Json;
          purpose?: string;
          token_hash?: string;
          used_at?: string | null;
        };
        Relationships: [];
      };
      company_invite_codes: {
        Row: {
          active: boolean;
          code: string;
          company_id: string;
          created_at: string;
          created_by: string;
          expires_at: string | null;
          id: string;
          max_uses: number | null;
          role: Database["public"]["Enums"]["app_role"];
          used_count: number;
        };
        Insert: {
          active?: boolean;
          code: string;
          company_id: string;
          created_at?: string;
          created_by: string;
          expires_at?: string | null;
          id?: string;
          max_uses?: number | null;
          role: Database["public"]["Enums"]["app_role"];
          used_count?: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          expires_at?: string | null;
          id?: string;
          max_uses?: number | null;
          role?: Database["public"]["Enums"]["app_role"];
          used_count?: number;
        };
        Relationships: [];
      };
      evictions: {
        Row: {
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by: string;
          document_file_id: string | null;
          filed_at: string | null;
          id: string;
          property_id: string;
          status: Database["public"]["Enums"]["eviction_status"];
          summary: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by: string;
          document_file_id?: string | null;
          filed_at?: string | null;
          id?: string;
          property_id: string;
          status?: Database["public"]["Enums"]["eviction_status"];
          summary?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          document_file_id?: string | null;
          filed_at?: string | null;
          id?: string;
          property_id?: string;
          status?: Database["public"]["Enums"]["eviction_status"];
          summary?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      file_status_logs: {
        Row: {
          actor_id: string;
          comment: string | null;
          company_id: string;
          created_at: string;
          file_id: string;
          id: string;
          next_status: Database["public"]["Enums"]["approval_status"];
          previous_status: Database["public"]["Enums"]["approval_status"] | null;
        };
        Insert: {
          actor_id: string;
          comment?: string | null;
          company_id: string;
          created_at?: string;
          file_id: string;
          id?: string;
          next_status: Database["public"]["Enums"]["approval_status"];
          previous_status?: Database["public"]["Enums"]["approval_status"] | null;
        };
        Update: {
          actor_id?: string;
          comment?: string | null;
          company_id?: string;
          created_at?: string;
          file_id?: string;
          id?: string;
          next_status?: Database["public"]["Enums"]["approval_status"];
          previous_status?: Database["public"]["Enums"]["approval_status"] | null;
        };
        Relationships: [];
      };
      files: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          category: Database["public"]["Enums"]["file_category"];
          checksum: string | null;
          company_id: string;
          created_at: string;
          description: string | null;
          eviction_id: string | null;
          extension: string | null;
          file_name: string;
          id: string;
          inspection_id: string | null;
          mime_type: string;
          module: Database["public"]["Enums"]["module_kind"];
          original_name: string;
          property_id: string;
          rejection_comment: string | null;
          report_id: string | null;
          size_bytes: number;
          status: Database["public"]["Enums"]["approval_status"];
          storage_bucket: string;
          storage_path: string;
          updated_at: string;
          uploader_id: string;
          version: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          category: Database["public"]["Enums"]["file_category"];
          checksum?: string | null;
          company_id: string;
          created_at?: string;
          description?: string | null;
          eviction_id?: string | null;
          extension?: string | null;
          file_name: string;
          id?: string;
          inspection_id?: string | null;
          mime_type: string;
          module: Database["public"]["Enums"]["module_kind"];
          original_name: string;
          property_id: string;
          rejection_comment?: string | null;
          report_id?: string | null;
          size_bytes: number;
          status?: Database["public"]["Enums"]["approval_status"];
          storage_bucket?: string;
          storage_path: string;
          updated_at?: string;
          uploader_id: string;
          version?: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          category?: Database["public"]["Enums"]["file_category"];
          checksum?: string | null;
          company_id?: string;
          created_at?: string;
          description?: string | null;
          eviction_id?: string | null;
          extension?: string | null;
          file_name?: string;
          id?: string;
          inspection_id?: string | null;
          mime_type?: string;
          module?: Database["public"]["Enums"]["module_kind"];
          original_name?: string;
          property_id?: string;
          rejection_comment?: string | null;
          report_id?: string | null;
          size_bytes?: number;
          status?: Database["public"]["Enums"]["approval_status"];
          storage_bucket?: string;
          storage_path?: string;
          updated_at?: string;
          uploader_id?: string;
          version?: number;
        };
        Relationships: [];
      };
      inspections: {
        Row: {
          company_id: string;
          completed_at: string | null;
          created_at: string;
          id: string;
          inspector_id: string;
          property_id: string;
          report_file_id: string | null;
          scheduled_for: string | null;
          status: Database["public"]["Enums"]["inspection_status"];
          summary: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          inspector_id: string;
          property_id: string;
          report_file_id?: string | null;
          scheduled_for?: string | null;
          status?: Database["public"]["Enums"]["inspection_status"];
          summary?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          inspector_id?: string;
          property_id?: string;
          report_file_id?: string | null;
          scheduled_for?: string | null;
          status?: Database["public"]["Enums"]["inspection_status"];
          summary?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          company_id: string;
          created_at: string;
          event_type: string;
          id: string;
          message: string;
          metadata: Json;
          read_at: string | null;
          recipient_user_id: string | null;
          title: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          event_type: string;
          id?: string;
          message: string;
          metadata?: Json;
          read_at?: string | null;
          recipient_user_id?: string | null;
          title: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          event_type?: string;
          id?: string;
          message?: string;
          metadata?: Json;
          read_at?: string | null;
          recipient_user_id?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          address_line_1: string;
          address_line_2: string | null;
          city: string;
          company_id: string;
          country: string;
          created_at: string;
          id: string;
          name: string;
          postal_code: string;
          reference_code: string;
          state: string;
          status: Database["public"]["Enums"]["property_status"];
          updated_at: string;
        };
        Insert: {
          address_line_1: string;
          address_line_2?: string | null;
          city: string;
          company_id: string;
          country?: string;
          created_at?: string;
          id?: string;
          name: string;
          postal_code: string;
          reference_code: string;
          state: string;
          status?: Database["public"]["Enums"]["property_status"];
          updated_at?: string;
        };
        Update: {
          address_line_1?: string;
          address_line_2?: string | null;
          city?: string;
          company_id?: string;
          country?: string;
          created_at?: string;
          id?: string;
          name?: string;
          postal_code?: string;
          reference_code?: string;
          state?: string;
          status?: Database["public"]["Enums"]["property_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          company_id: string;
          created_at: string;
          description: string | null;
          id: string;
          property_id: string;
          report_date: string;
          report_file_id: string;
          status: Database["public"]["Enums"]["report_status"];
          title: string;
          updated_at: string;
          uploaded_by: string;
          video_file_id: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          property_id: string;
          report_date: string;
          report_file_id: string;
          status?: Database["public"]["Enums"]["report_status"];
          title: string;
          updated_at?: string;
          uploaded_by: string;
          video_file_id?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          property_id?: string;
          report_date?: string;
          report_file_id?: string;
          status?: Database["public"]["Enums"]["report_status"];
          title?: string;
          updated_at?: string;
          uploaded_by?: string;
          video_file_id?: string | null;
        };
        Relationships: [];
      };
      site_content: {
        Row: {
          content: Json;
          created_at: string;
          id: string;
          key: string;
          updated_at: string;
        };
        Insert: {
          content?: Json;
          created_at?: string;
          id?: string;
          key?: string;
          updated_at?: string;
        };
        Update: {
          content?: Json;
          created_at?: string;
          id?: string;
          key?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          archived_at: string | null;
          company_id: string;
          created_at: string;
          created_by: string;
          escalated_at: string | null;
          escalated_by: string | null;
          id: string;
          message: string;
          resolved_at: string | null;
          resolved_by: string | null;
          status: Database["public"]["Enums"]["support_status"];
          subject: string;
          target_level: "company_admin" | "platform_admin";
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          company_id: string;
          created_at?: string;
          created_by: string;
          escalated_at?: string | null;
          escalated_by?: string | null;
          id?: string;
          message: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["support_status"];
          subject: string;
          target_level?: "company_admin" | "platform_admin";
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          company_id?: string;
          created_at?: string;
          created_by?: string;
          escalated_at?: string | null;
          escalated_by?: string | null;
          id?: string;
          message?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["support_status"];
          subject?: string;
          target_level?: "company_admin" | "platform_admin";
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          avatar_url: string | null;
          company_id: string | null;
          contact_number: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          last_sign_in_at: string | null;
          role: Database["public"]["Enums"]["app_role"];
          status: Database["public"]["Enums"]["user_status"];
          updated_at: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          avatar_url?: string | null;
          company_id?: string | null;
          contact_number?: string | null;
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          last_sign_in_at?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          status?: Database["public"]["Enums"]["user_status"];
          updated_at?: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          avatar_url?: string | null;
          company_id?: string | null;
          contact_number?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          last_sign_in_at?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          status?: Database["public"]["Enums"]["user_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      app_role: "platform_admin" | "super_admin" | "corporate_user" | "employee" | "inspector";
      approval_status: "pending" | "approved" | "rejected";
      company_status: "pending_verification" | "verified" | "active";
      eviction_status: "draft" | "filed" | "completed";
      file_category:
        | "general"
        | "inspection"
        | "shopping_report"
        | "eviction"
        | "photo"
        | "video"
        | "pdf";
      inspection_status: "scheduled" | "completed" | "cancelled";
      module_kind:
        | "files"
        | "inspections"
        | "shopping_reports"
        | "evictions";
      property_status: "active" | "inactive";
      report_status: "draft" | "published" | "archived";
      support_status: "open" | "in_progress" | "resolved";
      user_status: "pending" | "approved" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type TableName = keyof Database["public"]["Tables"];
export type TableRow<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends TableName> = Database["public"]["Tables"][T]["Update"];
