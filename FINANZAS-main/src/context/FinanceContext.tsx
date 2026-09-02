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

  // Auto-clean legacy demo transactions for non-Alexis / non-Karlita users
  useEffect(() => {
    if (!user || isDemoMode) return;
    const name = (user.displayName || user.email || '').toLowerCase();
    const partnerName = (partner?.displayName || partner?.email || '').toLowerCase();
    const isAlexisOrKarlita = name.includes('alexis') || name.includes('karlita') || partnerName.includes('alexis') || partnerName.includes('karlita');

    if (!isAlexisOrKarlita && rawTransactions.length > 0) {
      const demoLeaked = rawTransactions.filter(t =>
        t.transactionId.startsWith('tx_demo_') ||
        t.description.includes('Renta mes') ||
        t.description.includes('Mantenimiento Auto') ||
        t.description.includes('Internet Fibra')
      );

      if (demoLeaked.length > 0) {
        demoLeaked.forEach(t => {
          financeService.deleteTransaction(t.transactionId);
        });
        setRawTransactions(prev => prev.filter(t =>
          !t.transactionId.startsWith('tx_demo_') &&
          !t.description.includes('Renta mes') &&
          !t.description.includes('Mantenimiento Auto') &&
          !t.description.includes('Internet Fibra')
        ));
      }
    }
  }, [user, partner, isDemoMode, rawTransactions]);

  // Filter transactions according to active scope (individual vs shared)
  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter(t => {
      // Strictly verify ownership: must belong to active user, paid by active user, or belong to active couple!
      const isMyTx = t.userId === user?.uid || t.paidBy === user?.uid;
      const isCoupleTx = Boolean((couple?.coupleId || partner?.uid) && (t.coupleId === couple?.coupleId || t.scope === 'shared'));

      if (!isMyTx && !isCoupleTx && !isDemoMode) {
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

    return rawAccounts.map((acc, idx) => {
      const accTxs = rawTransactions.filter(t =>
        (t.accountId === acc.accountId || (!t.accountId && idx === 0)) &&
        t.approvalStatus !== 'pending' &&
        t.approvalStatus !== 'rejected'
      );

      const incomeSum = accTxs
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);

      // Subtract expenses paid by active user (exclude expenses paid by partner)
      const expenseSum = accTxs
        .filter(t => {
          if (t.type !== 'expense') return false;
          if (partner?.uid && t.paidBy === partner.uid) return false;
          if (partner?.displayName && t.userName && t.userName.toLowerCase().includes(partner.displayName.toLowerCase())) return false;
          return true;
        })
        .reduce((s, t) => s + t.amount, 0);

      const currentBalance = Math.max(0, (acc.balance || 0) + incomeSum - expenseSum);

      return {
        ...acc,
        balance: currentBalance,
      };
    });
  }, [rawAccounts, rawTransactions, user, partner]);

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
    const isAlexis = (user?.displayName || user?.email || '').toLowerCase().includes('alexis');
    const isKarla = (user?.displayName || user?.email || '').toLowerCase().includes('karla') ||
                    (user?.displayName || user?.email || '').toLowerCase().includes('karlita');

    const u1Id = user?.uid || 'user_1';
    const u1Name = user?.displayName || (isKarla ? 'Karla Vizcaíno' : 'Alexis Guerra');

    let u2Id = partner?.uid || (u1Id === 'user_1' ? 'user_2' : 'partner_2');
    if (u2Id === u1Id) {
      u2Id = `${u1Id}_partner`;
    }

    let u2Name = partner?.displayName;
    if (!u2Name || u2Name.toLowerCase() === u1Name.toLowerCase()) {
      u2Name = u1Name.toLowerCase().includes('alexis') ? 'Karla Vizcaíno' : 'Alexis Guerra';
    }

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
    try {
      localStorage.clear();
      await financeService.clearDatabase();
    } catch (e) {}
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
