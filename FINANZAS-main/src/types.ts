export type FinancialScope = 'individual' | 'shared';
export type TransactionType = 'income' | 'expense';
export type SplitMethod = '50_50' | 'full' | 'custom';
export type AccountType = 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
export type CoupleStatus = 'pending' | 'active';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  partnerId?: string | null;
  coupleId?: string | null;
  inviteCode: string;
  currency: string;
  createdAt: string;
}

export interface Couple {
  coupleId: string;
  user1Id: string;
  user2Id: string | null;
  user1Name: string;
  user2Name?: string | null;
  status: CoupleStatus;
  createdAt: string;
}

export interface BankAccount {
  accountId: string;
  ownerId: string; // userId or coupleId
  ownerType: 'user' | 'couple';
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  createdAt: string;
}

export interface Transaction {
  transactionId: string;
  userId: string;
  userName?: string;
  coupleId?: string | null;
  scope: FinancialScope;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  description: string;
  paidBy: string; // userId who paid
  splitMethod: SplitMethod;
  splitRatioUser1?: number; // 0.5 for 50/50
  splitRatioUser2?: number; // 0.5 for 50/50
  accountId?: string | null;
  createdAt: string;
}

export interface Budget {
  budgetId: string;
  targetId: string; // userId or coupleId
  targetType: 'individual' | 'shared';
  category: string;
  limitAmount: number;
  period: string; // YYYY-MM
  createdAt: string;
}

export interface FinancialMetrics {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  savingsAmount: number;
  savingsRate: number; // Percentage 0 - 100
  expenseByCategory: Record<string, number>;
  monthlyTrend: {
    month: string;
    income: number;
    expense: number;
  }[];
}

export interface SharedDebtBalance {
  netAmount: number; // positive = user1 owes user2, negative = user2 owes user1
  debtorId: string | null;
  creditorId: string | null;
  debtorName: string;
  creditorName: string;
  amountOwed: number;
  isBalanced: boolean;
}

export type InsightSeverity = 'high' | 'medium' | 'low' | 'success';
export type InsightCategory = 'budget_alert' | 'unusual_expense' | 'savings_opportunity' | 'positive_trend';

export interface FinancialInsight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category: InsightCategory;
  categoryName?: string;
  impactAmount?: number;
  actionText?: string;
  actionType?: 'view_category' | 'adjust_budget' | 'review_transactions';
}
