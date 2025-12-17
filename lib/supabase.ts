import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('URL:', supabaseUrl ? '✓' : '✗');
  console.error('KEY:', supabaseKey ? '✓' : '✗');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Tipos para la base de datos
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number;
          name: string;
          icon: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      persons: {
        Row: {
          id: number;
          name: string;
          email: string | null;
          department: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['persons']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['persons']['Insert']>;
      };
      funds: {
        Row: {
          id: number;
          date: string;
          amount: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['funds']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['funds']['Insert']>;
      };
      expenses: {
        Row: {
          id: number;
          date: string;
          correspondent_to: string | null;
          executor: string;
          category_id: number | null;
          amount: number;
          voucher_number: string | null;
          notes: string | null;
          status: 'active' | 'cancelled' | 'approved';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
    };
  };
}

