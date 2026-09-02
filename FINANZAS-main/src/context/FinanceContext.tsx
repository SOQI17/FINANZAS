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
import { getCurrentPeriod } from '../utils/dateUtils';

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
  addTransaction: (tx: Omit<Transaction, 'transactionId' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
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

  const [rawTransactions, setRawTransactions] = useState<Transaction[]>(DEMO_TRANSACTIONS);
  const [rawAccounts, setRawAccounts] = useState<BankAccount[]>(DEMO_ACCOUNTS);
  const [rawBudgets, setRawBudgets] = useState<Budget[]>(DEMO_BUDGETS);

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
  }, [user, couple, isDemoMode]);

  // Filter transactions according to active scope (individual vs shared)
  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter(t => {
      if (activeScope === 'individual') {
        return t.scope === 'individual';
      } else {
        return t.scope === 'shared';
      }
    });
  }, [rawTransactions, activeScope]);

  // Filter accounts according to active scope
  const filteredAccounts = useMemo(() => {
    return rawAccounts.filter(a => {
      if (activeScope === 'individual') {
        return a.ownerType === 'user';
      } else {
        return a.ownerType === 'couple';
      }
    });
  }, [rawAccounts, activeScope]);

  // Filter budgets according to active scope
  const filteredBudgets = useMemo(() => {
    return rawBudgets.filter(b => {
      if (activeScope === 'individual') {
        return b.targetType === 'individual';
      } else {
        return b.targetType === 'shared';
      }
    });
  }, [rawBudgets, activeScope]);

  // Monthly filtered transactions according to selected period (YYYY-MM)
  const periodTransactions = useMemo(() => {
    return filteredTransactions.filter(t => t.date.startsWith(selectedPeriod));
  }, [filteredTransactions, selectedPeriod]);

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

    // Generate monthly trend
    const periods = ['2026-07', '2026-06', '2026-05'];
    const monthlyTrend = periods.map(m => {
      const mTxs = filteredTransactions.filter(t => t.date.startsWith(m));
      const inc = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return {
        month: m === '2026-07' ? 'Julio' : m === '2026-06' ? 'Junio' : 'Mayo',
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
  }, [filteredAccounts, periodTransactions, filteredTransactions]);

  // Calculate Shared Debt Balance
  const sharedDebt: SharedDebtBalance = useMemo(() => {
    const u1Id = user?.uid || DEMO_USER_1.uid;
    const u1Name = user?.displayName || DEMO_USER_1.displayName;
    const u2Id = partner?.uid || DEMO_USER_2.uid;
    const u2Name = partner?.displayName || DEMO_USER_2.displayName;

    return calculateSharedDebtBalance(rawTransactions, u1Id, u2Id, u1Name, u2Name);
  }, [rawTransactions, user, partner]);

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

    // Optimistic local state update (0ms instant response)
    setRawTransactions(prev => [newTx, ...prev.filter(t => t.transactionId !== newTx.transactionId)]);
    
    if (newTx.accountId) {
      setRawAccounts(prev =>
        prev.map(a =>
          a.accountId === newTx.accountId
            ? { ...a, balance: a.balance + (newTx.type === 'income' ? newTx.amount : -newTx.amount) }
            : a
        )
      );
    }

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

    if (isDemoMode) {
      setRawBudgets(prev => {
        const filtered = prev.filter(
          b => !(b.category === newBudget.category && b.targetId === newBudget.targetId && b.period === newBudget.period)
        );
        return [...filtered, newBudget];
      });
    } else {
      await financeService.saveBudget(newBudget);
      setRawBudgets(prev => {
        const filtered = prev.filter(
          b => !(b.category === newBudget.category && b.targetId === newBudget.targetId && b.period === newBudget.period)
        );
        return [...filtered, newBudget];
      });
    }
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
      userId: sharedDebt.debtorId || user?.uid || DEMO_USER_1.uid,
      userName: sharedDebt.debtorName,
      coupleId: couple?.coupleId || DEMO_COUPLE.coupleId,
      scope: 'shared',
      type: 'income',
      amount: amount,
      category: 'Saldar Deuda Pareja',
      date: new Date().toISOString().split('T')[0],
      description: `Saldado de deuda de ${sharedDebt.debtorName} a ${sharedDebt.creditorName}`,
      paidBy: sharedDebt.debtorId || user?.uid || DEMO_USER_1.uid,
      splitMethod: '50_50',
    };

    await addTransaction(settlementTx);
  };

  const clearAllData = async () => {
    setRawTransactions([]);
    setRawAccounts([]);
    setRawBudgets([]);
    if (!isDemoMode) {
      await financeService.clearDatabase();
    }
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
        addTransaction,
        deleteTransaction,
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
