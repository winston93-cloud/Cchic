export interface Expense {
  id: number;
  date: string;
  correspondent_to?: string;
  executor: string;
  category_id?: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  amount: number;
  voucher_number?: string;
  notes?: string;
  status?: 'active' | 'cancelled' | 'approved';
  created_at?: string;
  updated_at?: string;
  categories?: {
    name: string;
    icon: string;
    color: string;
  };
}

export interface Person {
  id: number;
  name: string;
  last_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  identification?: string;
  department?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Balance {
  totalFunds: number;
  totalExpenses: number;
  balance: number;
}

export interface Fund {
  id: number;
  date: string;
  amount: number;
  notes?: string;
  created_at?: string;
}

export interface Report {
  executor?: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  count: number;
  total: number;
  average: number;
}

