import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Couple, BankAccount, Transaction, Budget } from '../types';
import { DEMO_USER_1, DEMO_USER_2, DEMO_COUPLE, DEMO_ACCOUNTS, DEMO_TRANSACTIONS, DEMO_BUDGETS } from '../data/demoData';

// Generate 8-character invite code e.g. "PAREJA-9X2Y"
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PAREJA-${code}`;
}

export const financeService = {
  // --- USERS ---
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!auth.currentUser) {
      if (uid === DEMO_USER_1.uid) return DEMO_USER_1;
      if (uid === DEMO_USER_2.uid) return DEMO_USER_2;
      return null;
    }
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (e) {
      // Silently fall back if ad blocker or permission blocks request
    }
    if (uid === DEMO_USER_1.uid) return DEMO_USER_1;
    if (uid === DEMO_USER_2.uid) return DEMO_USER_2;
    return null;
  },

  async createUserProfile(profile: UserProfile): Promise<void> {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
    } catch (e) {
      // Silently fall back if ad blocker or permission blocks request
    }
  },

  async findUserByInviteCode(inviteCode: string): Promise<UserProfile | null> {
    if (!auth.currentUser) {
      if (inviteCode.trim().toUpperCase() === DEMO_USER_2.inviteCode) return DEMO_USER_2;
      if (inviteCode.trim().toUpperCase() === DEMO_USER_1.inviteCode) return DEMO_USER_1;
      return null;
    }
    try {
      const q = query(collection(db, 'users'), where('inviteCode', '==', inviteCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as UserProfile;
      }
    } catch (e) {
      // Silently fall back
    }
    if (inviteCode.trim().toUpperCase() === DEMO_USER_2.inviteCode) return DEMO_USER_2;
    if (inviteCode.trim().toUpperCase() === DEMO_USER_1.inviteCode) return DEMO_USER_1;
    return null;
  },

  // --- COUPLES ---
  async linkCouple(user1: UserProfile, partner: UserProfile): Promise<Couple> {
    const coupleId = `couple_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const couple: Couple = {
      coupleId,
      user1Id: user1.uid,
      user2Id: partner.uid,
      user1Name: user1.displayName,
      user2Name: partner.displayName,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'couples', coupleId), couple);
        // Update both user profiles
        await updateDoc(doc(db, 'users', user1.uid), { partnerId: partner.uid, coupleId });
        await updateDoc(doc(db, 'users', partner.uid), { partnerId: user1.uid, coupleId });
      } catch (e) {
        // Fall back gracefully
      }
    }

    return couple;
  },

  async getCouple(coupleId: string): Promise<Couple | null> {
    if (!auth.currentUser) {
      if (coupleId === DEMO_COUPLE.coupleId) return DEMO_COUPLE;
      return null;
    }
    try {
      const snap = await getDoc(doc(db, 'couples', coupleId));
      if (snap.exists()) {
        return snap.data() as Couple;
      }
    } catch (e) {
      // Fall back
    }
    if (coupleId === DEMO_COUPLE.coupleId) return DEMO_COUPLE;
    return null;
  },

  // --- ACCOUNTS ---
  async getAccounts(ownerId: string): Promise<BankAccount[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'accounts'), where('ownerId', '==', ownerId));
      const snap = await getDocs(q);
      const accounts: BankAccount[] = [];
      snap.forEach(d => accounts.push(d.data() as BankAccount));
      return accounts;
    } catch (e) {
      return [];
    }
  },

  async saveAccount(account: BankAccount): Promise<void> {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'accounts', account.accountId), account, { merge: true });
    } catch (e) {
      // Fall back
    }
  },

  async deleteAccount(accountId: string): Promise<void> {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'accounts', accountId));
    } catch (e) {
      // Fall back
    }
  },

  // --- TRANSACTIONS ---
  subscribeTransactions(
    userId: string,
    coupleId: string | null,
    callback: (txs: Transaction[]) => void
  ) {
    if (!auth.currentUser) {
      callback([]);
      return () => {};
    }
    try {
      const q = query(collection(db, 'transactions'));
      return onSnapshot(q, (snapshot) => {
        const txs: Transaction[] = [];
        snapshot.forEach(docSnap => {
          const t = docSnap.data() as Transaction;
          // Filter according to user, couple, or shared scope
          if (t.userId === userId || (coupleId && t.coupleId === coupleId) || t.scope === 'shared') {
            txs.push(t);
          }
        });
        txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(txs);
      }, (error) => {
        callback([]);
      });
    } catch (e) {
      callback([]);
      return () => {};
    }
  },

  async addTransaction(tx: Transaction): Promise<void> {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'transactions', tx.transactionId), tx);
      // Also adjust account balance if accountId is set
      if (tx.accountId) {
        const accountRef = doc(db, 'accounts', tx.accountId);
        const accSnap = await getDoc(accountRef);
        if (accSnap.exists()) {
          const currentBal = accSnap.data().balance || 0;
          const delta = tx.type === 'income' ? tx.amount : -tx.amount;
          await updateDoc(accountRef, { balance: currentBal + delta });
        }
      }
    } catch (e) {
      // Fall back
    }
  },

  async deleteTransaction(transactionId: string): Promise<void> {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'transactions', transactionId));
    } catch (e) {
      // Fall back
    }
  },

  // --- BUDGETS ---
  async getBudgets(targetId: string): Promise<Budget[]> {
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'budgets'), where('targetId', '==', targetId));
      const snap = await getDocs(q);
      const budgets: Budget[] = [];
      snap.forEach(d => budgets.push(d.data() as Budget));
      return budgets;
    } catch (e) {
      return [];
    }
  },

  async saveBudget(budget: Budget): Promise<void> {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'budgets', budget.budgetId), budget, { merge: true });
    } catch (e) {
      // Fall back
    }
  },

  async deleteBudget(budgetId: string): Promise<void> {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'budgets', budgetId));
    } catch (e) {
      // Fall back
    }
  },

  // --- WIPE / CLEAR ALL FIRESTORE DATA ---
  async clearDatabase(): Promise<void> {
    if (!auth.currentUser) return;
    try {
      const collectionsToWipe = ['transactions', 'accounts', 'budgets'];
      for (const colName of collectionsToWipe) {
        const snap = await getDocs(collection(db, colName));
        for (const d of snap.docs) {
          await deleteDoc(doc(db, colName, d.id));
        }
      }
    } catch (e) {
      // Fall back
    }
  },

  // --- SEED DEMO DATA TO FIRESTORE ---
  async seedDemoData(user1: UserProfile, partner?: UserProfile | null): Promise<void> {
    if (!auth.currentUser) return;
    try {
      // Users
      await setDoc(doc(db, 'users', user1.uid), user1, { merge: true });
      if (partner) {
        await setDoc(doc(db, 'users', partner.uid), partner, { merge: true });
        // Couple
        await setDoc(doc(db, 'couples', DEMO_COUPLE.coupleId), DEMO_COUPLE, { merge: true });
      }

      // Accounts
      for (const acc of DEMO_ACCOUNTS) {
        await setDoc(doc(db, 'accounts', acc.accountId), acc, { merge: true });
      }

      // Budgets
      for (const b of DEMO_BUDGETS) {
        await setDoc(doc(db, 'budgets', b.budgetId), b, { merge: true });
      }

      // Transactions
      for (const t of DEMO_TRANSACTIONS) {
        await setDoc(doc(db, 'transactions', t.transactionId), t, { merge: true });
      }
    } catch (e) {
      // Fall back
    }
  }
};
