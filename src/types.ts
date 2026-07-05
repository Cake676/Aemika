export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Budget {
  category: string;
  amount: number;
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  budgets: { [category: string]: number };
}

export interface FinancialInsight {
  title: string;
  description: string;
  type: 'warning' | 'info' | 'success';
}

export const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'อาหาร', icon: 'Utensils', color: '#F87171' }, // Red-400
  { id: 'transport', name: 'เดินทาง', icon: 'Car', color: '#60A5FA' }, // Blue-400
  { id: 'shopping', name: 'ช้อปปิ้ง', icon: 'ShoppingBag', color: '#F472B6' }, // Pink-400
  { id: 'entertainment', name: 'บันเทิง', icon: 'Film', color: '#A78BFA' }, // Purple-400
  { id: 'utilities', name: 'บิล & ค่าบ้าน', icon: 'Home', color: '#FBBF24' }, // Amber-400
  { id: 'health', name: 'สุขภาพ', icon: 'HeartPulse', color: '#34D399' }, // Emerald-400
  { id: 'others_exp', name: 'อื่นๆ', icon: 'MoreHorizontal', color: '#9CA3AF' } // Gray-400
];

export const INCOME_CATEGORIES = [
  { id: 'salary', name: 'เงินเดือน', icon: 'Briefcase', color: '#10B981' }, // Emerald-500
  { id: 'business', name: 'ขายของ/ธุรกิจ', icon: 'Store', color: '#3B82F6' }, // Blue-500
  { id: 'investment', name: 'การลงทุน', icon: 'TrendingUp', color: '#8B5CF6' }, // Purple-500
  { id: 'allowance', name: 'เงินสนับสนุน', icon: 'Gift', color: '#F59E0B' }, // Amber-500
  { id: 'others_inc', name: 'อื่นๆ', icon: 'MoreHorizontal', color: '#6B7280' } // Gray-500
];

export const MONTHS_THAI = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
