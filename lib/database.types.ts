export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          icon: string | null;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          user_id?: string;
        };
      };
      items: {
        Row: {
          category_id: string | null;
          completed: boolean;
          created_at: string;
          id: string;
          name: string;
          position: number;
          price: number | null;
          quantity: string | null;
          user_id: string;
        };
        Insert: {
          category_id?: string | null;
          completed?: boolean;
          created_at?: string;
          id?: string;
          name: string;
          position?: number;
          price?: number | null;
          quantity?: string | null;
          user_id: string;
        };
        Update: {
          category_id?: string | null;
          completed?: boolean;
          created_at?: string;
          id?: string;
          name?: string;
          position?: number;
          price?: number | null;
          quantity?: string | null;
          user_id?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
