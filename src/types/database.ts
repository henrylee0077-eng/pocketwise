// Hand-written mirror of the Supabase schema defined in
// supabase/migrations/0001_init.sql, 0002_transactions_phase1.sql,
// 0003_phase2.sql, and 0004_pin_and_reset.sql. If the schema changes,
// update this file (or, once the project is linked, regenerate it with:
// supabase gen types typescript --linked > src/types/database.ts
//
// Note: profiles.pin_hash is deliberately NOT typed here. All PIN
// hashing/verification happens server-side inside Postgres functions
// (set_pin/verify_pin/clear_pin) — the client only ever needs the
// generated `pin_enabled` boolean, never the hash itself.
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
          pin_enabled: boolean;
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
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: "cash" | "bank" | "ewallet" | "investment" | "credit_card" | "loan" | "installment";
          institution: string | null;
          currency: string;
          opening_balance: number;
          color: string;
          icon: string;
          credit_limit: number | null;
          interest_rate: number | null;
          statement_day: number | null;
          payment_due_day: number | null;
          min_payment_percent: number | null;
          is_archived: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: "cash" | "bank" | "ewallet" | "investment" | "credit_card" | "loan" | "installment";
          institution?: string | null;
          currency?: string;
          opening_balance?: number;
          color?: string;
          icon?: string;
          credit_limit?: number | null;
          interest_rate?: number | null;
          statement_day?: number | null;
          payment_due_day?: number | null;
          min_payment_percent?: number | null;
          is_archived?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: "cash" | "bank" | "ewallet" | "investment" | "credit_card" | "loan" | "installment";
          institution?: string | null;
          currency?: string;
          opening_balance?: number;
          color?: string;
          icon?: string;
          credit_limit?: number | null;
          interest_rate?: number | null;
          statement_day?: number | null;
          payment_due_day?: number | null;
          min_payment_percent?: number | null;
          is_archived?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          currency: string;
          note: string | null;
          expense_date: string;
          type: "expense" | "income" | "transfer";
          payment_method_id: string | null;
          priority: "high" | "medium" | "low" | null;
          merchant: string | null;
          account_id: string | null;
          to_account_id: string | null;
          recurring_transaction_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          currency?: string;
          note?: string | null;
          expense_date?: string;
          type?: "expense" | "income" | "transfer";
          payment_method_id?: string | null;
          priority?: "high" | "medium" | "low" | null;
          merchant?: string | null;
          account_id?: string | null;
          to_account_id?: string | null;
          recurring_transaction_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          amount?: number;
          currency?: string;
          note?: string | null;
          expense_date?: string;
          type?: "expense" | "income" | "transfer";
          payment_method_id?: string | null;
          priority?: "high" | "medium" | "low" | null;
          merchant?: string | null;
          account_id?: string | null;
          to_account_id?: string | null;
          recurring_transaction_id?: string | null;
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
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey";
            columns: ["to_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_recurring_transaction_id_fkey";
            columns: ["recurring_transaction_id"];
            isOneToOne: false;
            referencedRelation: "recurring_transactions";
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
      recurring_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: "expense" | "income" | "transfer";
          amount: number;
          category_id: string | null;
          account_id: string | null;
          to_account_id: string | null;
          payment_method_id: string | null;
          priority: "high" | "medium" | "low" | null;
          merchant: string | null;
          note: string | null;
          frequency: "daily" | "weekly" | "monthly" | "yearly";
          interval_count: number;
          start_date: string;
          end_date: string | null;
          next_run_date: string;
          last_generated_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: "expense" | "income" | "transfer";
          amount: number;
          category_id?: string | null;
          account_id?: string | null;
          to_account_id?: string | null;
          payment_method_id?: string | null;
          priority?: "high" | "medium" | "low" | null;
          merchant?: string | null;
          note?: string | null;
          frequency: "daily" | "weekly" | "monthly" | "yearly";
          interval_count?: number;
          start_date: string;
          end_date?: string | null;
          next_run_date: string;
          last_generated_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "expense" | "income" | "transfer";
          amount?: number;
          category_id?: string | null;
          account_id?: string | null;
          to_account_id?: string | null;
          payment_method_id?: string | null;
          priority?: "high" | "medium" | "low" | null;
          merchant?: string | null;
          note?: string | null;
          frequency?: "daily" | "weekly" | "monthly" | "yearly";
          interval_count?: number;
          start_date?: string;
          end_date?: string | null;
          next_run_date?: string;
          last_generated_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_transactions_to_account_id_fkey";
            columns: ["to_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_transactions_payment_method_id_fkey";
            columns: ["payment_method_id"];
            isOneToOne: false;
            referencedRelation: "payment_methods";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      account_balances: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: "cash" | "bank" | "ewallet" | "investment" | "credit_card" | "loan" | "installment";
          institution: string | null;
          currency: string;
          color: string;
          icon: string;
          credit_limit: number | null;
          interest_rate: number | null;
          statement_day: number | null;
          payment_due_day: number | null;
          min_payment_percent: number | null;
          is_archived: boolean;
          sort_order: number;
          opening_balance: number;
          current_balance: number;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      set_pin: {
        Args: { new_pin: string };
        Returns: void;
      };
      verify_pin: {
        Args: { candidate: string };
        Returns: Json;
      };
      clear_pin: {
        Args: Record<string, never>;
        Returns: void;
      };
      reset_my_account: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
