// Hand-written mirror of the Supabase schema defined in
// supabase/migrations/0001_init.sql and 0002_transactions_phase1.sql. If the
// schema changes, update this file (or, once the project is linked,
// regenerate it with: supabase gen types typescript --linked > src/types/database.ts
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
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          preferred_language: "en" | "zh";
          preferred_currency: string;
          household_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          preferred_language?: "en" | "zh";
          preferred_currency?: string;
          household_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          preferred_language?: "en" | "zh";
          preferred_currency?: string;
          household_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          key: string;
          name_en: string;
          name_zh: string;
          icon: string;
          color: string;
          is_essential: boolean;
          is_system: boolean;
          sort_order: number;
          type: "expense" | "income";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          key: string;
          name_en: string;
          name_zh: string;
          icon?: string;
          color?: string;
          is_essential?: boolean;
          is_system?: boolean;
          sort_order?: number;
          type?: "expense" | "income";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          key?: string;
          name_en?: string;
          name_zh?: string;
          icon?: string;
          color?: string;
          is_essential?: boolean;
          is_system?: boolean;
          sort_order?: number;
          type?: "expense" | "income";
          created_at?: string;
        };
        Relationships: [];
      };
      payment_methods: {
        Row: {
          id: string;
          user_id: string | null;
          key: string;
          name_en: string;
          name_zh: string;
          icon: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          key: string;
          name_en: string;
          name_zh: string;
          icon?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          key?: string;
          name_en?: string;
          name_zh?: string;
          icon?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          currency: string;
          note: string | null;
          expense_date: string;
          type: "expense" | "income";
          payment_method_id: string | null;
          priority: "high" | "medium" | "low" | null;
          merchant: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          currency?: string;
          note?: string | null;
          expense_date?: string;
          type?: "expense" | "income";
          payment_method_id?: string | null;
          priority?: "high" | "medium" | "low" | null;
          merchant?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          amount?: number;
          currency?: string;
          note?: string | null;
          expense_date?: string;
          type?: "expense" | "income";
          payment_method_id?: string | null;
          priority?: "high" | "medium" | "low" | null;
          merchant?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_payment_method_id_fkey";
            columns: ["payment_method_id"];
            isOneToOne: false;
            referencedRelation: "payment_methods";
            referencedColumns: ["id"];
          },
        ];
      };
      transaction_tags: {
        Row: {
          transaction_id: string;
          tag_id: string;
        };
        Insert: {
          transaction_id: string;
          tag_id: string;
        };
        Update: {
          transaction_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_tags_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          amount: number;
          warning_threshold_percent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          amount: number;
          warning_threshold_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month?: string;
          amount?: number;
          warning_threshold_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      category_budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          month: string;
          amount: number;
          warning_threshold_percent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          month: string;
          amount: number;
          warning_threshold_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          month?: string;
          amount?: number;
          warning_threshold_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "category_budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
