// Hand-written mirror of the Supabase schema defined in
// supabase/migrations/0001_init.sql. If the schema changes, update this file
// (or, once the project is linked, regenerate it with:
//   supabase gen types typescript --linked > src/types/database.ts
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
          created_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          currency: string;
          note: string | null;
          expense_date: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
