import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  FinancialScope,
  Transaction,
  BankAccount,
  Budget,
  FinancialMetrics,
  FinancialInsight,
  SharedDebtBalance
} from '../types';
import { useAuth } from './AuthContext';
import { financeService } from '../services/financeService';
import { generateFinancialInsights, calculateSharedDebtBalance } from '../services/financialInsights';
import { DEMO_ACCOUNTS, DEMO_BUDGETS, DEMO_TRANSACTIONS, DEMO_USER_1, DEMO_USER_2, DEMO_COUPLE } from '../data/demoData';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getCurrentPeriod } from '../utils/dateUtils';
import { CoupleMembers, getCoupleMembers, isMemberAPayer, isSettlementTx } from '../utils/splitUtils';

const MONTH_SHORT_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface FinanceContextType {
  activeScope: FinancialScope;
  setActiveScope: (scope: FinancialScope) => void;
  selectedPeriod: string; // "YYYY-MM"
  setSelectedPeriod: (period: string) => void;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  accounts: BankAccount[];
  budgets: Budget[];
  metrics: FinancialMetrics;
  insights: FinancialInsight[];
  sharedDebt: SharedDebtBalance;
  members: CoupleMembers;
  addTransaction: (tx: Omit<Transaction, 'transactionId' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  approveTransaction: (id: string) => Promise<void>;
  rejectTransaction: (id: string) => Promise<void>;
  addAccount: (acc: Omit<BankAccount, 'accountId' | 'createdAt'>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  saveBudget: (budget: Omit<Budget, 'budgetId' | 'createdAt'>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  settleSharedDebt: (amount: number) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, partner, couple, isDemoMode } = useAuth();
  const [activeScope, setActiveScope] = useState<FinancialScope>('individual');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentPeriod());

  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [rawAccounts, setRawAccounts] = useState<BankAccount[]>([]);
  const [rawBudgets, setRawBudgets] = useState<Budget[]>([]);

  // Subscribe or fetch data
  useEffect(() => {
    if (!user) return;

    if (isDemoMode) {
      setRawTransactions(DEMO_TRANSACTIONS);
      setRawAccounts(DEMO_ACCOUNTS);
      setRawBudgets(DEMO_BUDGETS);
    } else {
      // Subscribe to transactions
      const unsubscribe = financeService.subscribeTransactions(
        user.uid,
        couple?.coupleId || null,
        partner?.uid || null,
        (txs) => setRawTransactions(txs)
      );

      // Fetch accounts and budgets
      const loadInitialData = async () => {
        const userAccs = await financeService.getAccounts(user.uid);
        let coupleAccs: BankAccount[] = [];
        if (couple) {
          coupleAccs = await financeService.getAccounts(couple.coupleId);
        }
        setRawAccounts([...userAccs, ...coupleAccs]);

        const userBuds = await financeService.getBudgets(user.uid);
        let coupleBuds: Budget[] = [];
        if (couple) {
          coupleBuds = await financeService.getBudgets(couple.coupleId);
        }
        setRawBudgets([...userBuds, ...coupleBuds]);
      };

      loadInitialData();
      return () => unsubscribe();
    }
  }, [user, partner, couple, isDemoMode]);

  // The two members of the couple (or just the user, if they have no partner)
  const members = useMemo(() => getCoupleMembers(user, partner, couple), [user, partner, couple]);

  // Filter transactions according to active scope (individual vs shared)
  const filteredTransactions = useMemo(() => {
    const partnerId = partner?.uid || '';
    return rawTransactions.filter(t => {
      // Strictly verify ownership: the user's own transactions, or shared ones of their own couple.
      // A partner's personal transactions and other couples' data are never shown.
      const isMyTx = t.userId === user?.uid || t.paidBy === user?.uid;
      // (matched by member ids, not coupleId: older versions tagged strangers' transactions with a coupleId)
      const isOurSharedTx = t.scope === 'shared' && Boolean(partnerId) && (
        t.userId === partnerId ||
        t.paidBy === partnerId
      );

      if (!isMyTx && !isOurSharedTx && !isDemoMode) {
        return false;
      }

      // Incomes fund both individual and couple finances
      if (t.type === 'income') {
        return true;
      }
      if (activeScope === 'individual') {
        // In Mis Finanzas, ONLY show expenses paid by this user (exclude expenses paid by partner)
        if (partner?.uid && t.paidBy === partner.uid) {
          return false;
        }
        if (partner?.displayName && t.userName && t.userName.toLowerCase().includes(partner.displayName.toLowerCase())) {
          return false;
        }
        return true;
      } else {
        // In En Pareja, show all shared expenses paid by both
        return t.scope === 'shared';
      }
    });
  }, [rawTransactions, activeScope, user, partner, couple, isDemoMode]);

  // Unified accounts list with dynamic balance calculation
  const filteredAccounts = useMemo(() => {
    if (rawAccounts.length === 0) {
      return [];
    }

    const partnerId = partner?.uid || '';

    // Filter accounts by scope:
    // In Mis Finanzas (individual): ONLY show accounts belonging to active user
    // In En Pareja (shared): show accounts belonging to active user AND linked partner
    const scopedAccounts = rawAccounts.filter(acc => {
      if (activeScope === 'individual') {
        if (partnerId && acc.ownerId === partnerId) {
          return false; // Exclude partner's personal account from Mis Finanzas
        }
      }
      return true;
    });

    return scopedAccounts.map((acc, idx) => {
      // Match transactions belonging to this account, or assign unlinked transactions to primary account (idx === 0)
      const accTxs = filteredTransactions.filter(t => {
        if (t.approvalStatus === 'pending' || t.approvalStatus === 'rejected') return false;
        
        // If transaction specifies a valid active accountId, match it strictly
        const isValidAccount = Boolean(t.accountId && rawAccounts.some(a => a.accountId === t.accountId));
        if (isValidAccount) {
          return t.accountId === acc.accountId;
        }
        
        // Fallback: assign to primary account (idx === 0) so expenses always deduct from balance
        return idx === 0;
      });

      // A debt settlement is money out for the person who paid it and money in for the one who received it
      const currentIsMemberA = members.a.id === user?.uid;
      const settlementSum = accTxs
        .filter(t => isSettlementTx(t))
        .reduce((s, t) => s + (isMemberAPayer(t, members) === currentIsMemberA ? -t.amount : t.amount), 0);

      const incomeSum = accTxs
        .filter(t => t.type === 'income' && !isSettlementTx(t))
        .reduce((s, t) => s + t.amount, 0);

      const expenseSum = accTxs
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);

      const openingBalance = acc.balance || 0;
      const currentBalance = openingBalance + incomeSum - expenseSum + settlementSum;

      return {
        ...acc,
        balance: currentBalance,
      };
    });
  }, [rawAccounts, filteredTransactions, activeScope, partner, user, members]);

  // Filter budgets according to active scope. Budgets repeat every month, so keep only the
  // most recent limit per category (older ones from previous months are superseded).
  const filteredBudgets = useMemo(() => {
    const latestByCategory = new Map<string, Budget>();
    rawBudgets
      .filter(b => b.targetType === (activeScope === 'individual' ? 'individual' : 'shared'))
      .forEach(b => {
        const existing = latestByCategory.get(b.category);
        if (!existing || (b.createdAt || '') > (existing.createdAt || '')) {
          latestByCategory.set(b.category, b);
        }
      });
    return Array.from(latestByCategory.values());
  }, [rawBudgets, activeScope]);

  // Approved, non-settlement transactions: the ones that count as real income/expenses in metrics
  const countedTransactions = useMemo(() => {
    return filteredTransactions.filter(t =>
      t.approvalStatus !== 'pending' && t.approvalStatus !== 'rejected' && !isSettlementTx(t)
    );
  }, [filteredTransactions]);

  // Monthly filtered transactions according to selected period (YYYY-MM)
  const periodTransactions = useMemo(() => {
    return countedTransactions.filter(t => (t.date || '').startsWith(selectedPeriod));
  }, [countedTransactions, selectedPeriod]);

  // Calculate Metrics for Current Period
  const metrics: FinancialMetrics = useMemo(() => {
    const totalBalance = filteredAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalIncome = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const savingsAmount = Math.max(0, totalIncome - totalExpenses);
    const savingsRate = totalIncome > 0 ? (savingsAmount / totalIncome) * 100 : 0;

    const expenseByCategory: Record<string, number> = {};
    periodTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      });

    // Generate monthly trend: the selected month and the two before it, oldest first
    const [selYear, selMonth] = selectedPeriod.split('-').map(Number);
    const monthlyTrend = [2, 1, 0].map(offset => {
      const d = new Date(selYear, selMonth - 1 - offset, 1);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mTxs = countedTransactions.filter(t => (t.date || '').startsWith(m));
      const inc = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return {
        month: MONTH_SHORT_NAMES[d.getMonth()],
        income: inc,
        expense: exp,
      };
    });

    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      savingsAmount,
      savingsRate,
      expenseByCategory,
      monthlyTrend,
    };
  }, [filteredAccounts, periodTransactions, countedTransactions, selectedPeriod]);

  // Calculate Shared Debt Balance
  const sharedDebt: SharedDebtBalance = useMemo(() => {
    // Without a partner there is nobody to owe money to
    if (!partner) {
      return {
        netAmount: 0,
        debtorId: null,
        creditorId: null,
        debtorName: '',
        creditorName: '',
        amountOwed: 0,
        isBalanced: true,
      };
    }
    return calculateSharedDebtBalance(rawTransactions, members);
  }, [rawTransactions, partner, members]);

  // Generate Financial Insights
  const insights = useMemo(() => {
    return generateFinancialInsights(periodTransactions, filteredBudgets, metrics);
  }, [periodTransactions, filteredBudgets, metrics]);

  // Actions
  const addTransaction = async (txData: Omit<Transaction, 'transactionId' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      userId: user?.uid || txData.userId || 'user_1',
      userName: txData.userName || user?.displayName || 'Usuario',
      coupleId: couple?.coupleId || txData.coupleId || null,
      transactionId: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    // Optimistic local state update (0ms instant response).
    // NOTE: we intentionally do NOT touch rawAccounts/balance here. `acc.balance`
    // is the account's fixed "Saldo Inicial" (opening balance); the *current*
    // balance is always derived in `filteredAccounts` as opening balance +
    // income - expenses over `rawTransactions`. Adding the transaction here
    // is enough to make the derived balance update instantly — mutating
    // acc.balance too used to double-count every transaction.
    setRawTransactions(prev => [newTx, ...prev.filter(t => t.transactionId !== newTx.transactionId)]);

    // Auto-switch scope to transaction scope so it immediately displays
    if (newTx.scope !== activeScope) {
      setActiveScope(newTx.scope);
    }

    if (!isDemoMode) {
      try {
        await financeService.addTransaction(newTx);
      } catch (err) {
        console.error('Error saving transaction to Firestore:', err);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    setRawTransactions(prev => prev.filter(t => t.transactionId !== id));
    if (!isDemoMode) {
      try {
        await financeService.deleteTransaction(id);
      } catch (err) {
        console.error('Error deleting transaction from Firestore:', err);
      }
    }
  };

  const approveTransaction = async (id: string) => {
    setRawTransactions(prev =>
      prev.map(t => (t.transactionId === id ? { ...t, approvalStatus: 'approved' } : t))
    );
    if (!isDemoMode && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'transactions', id), { approvalStatus: 'approved' });
      } catch (err) {
        console.warn('Could not approve transaction in Firestore:', err);
      }
    }
  };

  const rejectTransaction = async (id: string) => {
    setRawTransactions(prev => prev.filter(t => t.transactionId !== id));
    if (!isDemoMode) {
      try {
        await financeService.deleteTransaction(id);
      } catch (err) {
        console.warn('Could not reject transaction in Firestore:', err);
      }
    }
  };

  const addAccount = async (accData: Omit<BankAccount, 'accountId' | 'createdAt'>) => {
    const newAcc: BankAccount = {
      ...accData,
      accountId: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      setRawAccounts(prev => [...prev, newAcc]);
    } else {
      await financeService.saveAccount(newAcc);
      setRawAccounts(prev => [...prev, newAcc]);
    }
  };

  const deleteAccount = async (id: string) => {
    if (isDemoMode) {
      setRawAccounts(prev => prev.filter(a => a.accountId !== id));
    } else {
      await financeService.deleteAccount(id);
      setRawAccounts(prev => prev.filter(a => a.accountId !== id));
    }
  };

  const saveBudget = async (budgetData: Omit<Budget, 'budgetId' | 'createdAt'>) => {
    const newBudget: Budget = {
      ...budgetData,
      budgetId: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    // A budget repeats every month: the new limit replaces any earlier one for the same category
    const superseded = rawBudgets.filter(
      b => b.category === newBudget.category && b.targetId === newBudget.targetId
    );

    if (!isDemoMode) {
      await financeService.saveBudget(newBudget);
      for (const b of superseded) {
        await financeService.deleteBudget(b.budgetId);
      }
    }
    setRawBudgets(prev => [
      ...prev.filter(b => !superseded.some(s => s.budgetId === b.budgetId)),
      newBudget,
    ]);
  };

  const deleteBudget = async (id: string) => {
    if (isDemoMode) {
      setRawBudgets(prev => prev.filter(b => b.budgetId !== id));
    } else {
      await financeService.deleteBudget(id);
      setRawBudgets(prev => prev.filter(b => b.budgetId !== id));
    }
  };

  const settleSharedDebt = async (amount: number) => {
    if (sharedDebt.isBalanced || amount <= 0) return;

    // Create a transaction that records the debt settlement
    const settlementTx: Omit<Transaction, 'transactionId' | 'createdAt'> = {
      userId: user?.uid || sharedDebt.debtorId || DEMO_USER_1.uid,
      userName: sharedDebt.debtorName,
      coupleId: couple?.coupleId || null,
      scope: 'shared',
      type: 'income',
      amount: amount,
      category: 'Saldar Deuda Pareja',
      date: new Date().toISOString().split('T')[0],
      description: `Saldado de deuda de ${sharedDebt.debtorName} a ${sharedDebt.creditorName}`,
      paidBy: sharedDebt.debtorId || sharedDebt.debtorName,
      splitMethod: 'full',
      approvalStatus: 'approved',
    };

    await addTransaction(settlementTx);
  };

  // Restart only this user's own data. Other users' data is never touched, and shared
  // transactions are kept while there is a partner because they make up the debt balance.
  const clearAllData = async () => {
    if (!user) return;
    const hasPartner = Boolean(partner);
    setRawTransactions(prev => prev.filter(t => t.userId !== user.uid || (hasPartner && t.scope === 'shared')));
    setRawAccounts(prev => prev.filter(a => a.ownerId !== user.uid));
    setRawBudgets(prev => prev.filter(b => b.targetId !== user.uid));
    if (isDemoMode) return;
    try {
      localStorage.removeItem(`duofinanzas_local_txs_${user.uid}`);
    } catch (e) {}
    await financeService.clearUserData(user.uid, hasPartner);
  };

  return (
    <FinanceContext.Provider
      value={{
        activeScope,
        setActiveScope,
        selectedPeriod,
        setSelectedPeriod,
        transactions: rawTransactions,
        filteredTransactions,
        accounts: filteredAccounts,
        budgets: filteredBudgets,
        metrics,
        insights,
        sharedDebt,
        members,
        addTransaction,
        deleteTransaction,
        approveTransaction,
        rejectTransaction,
        addAccount,
        deleteAccount,
        saveBudget,
        deleteBudget,
        settleSharedDebt,
        clearAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
