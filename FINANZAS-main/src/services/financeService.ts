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
import { db } from '../firebase';
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
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (e) {
      console.warn('Firestore getUserProfile error, fallback to local', e);
    }
    if (uid === DEMO_USER_1.uid) return DEMO_USER_1;
    if (uid === DEMO_USER_2.uid) return DEMO_USER_2;
    return null;
  },

  async createUserProfile(profile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
    } catch (e) {
      console.error('Error creating user profile in Firestore', e);
    }
  },

  async findUserByInviteCode(inviteCode: string): Promise<UserProfile | null> {
    try {
      const q = query(collection(db, 'users'), where('inviteCode', '==', inviteCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as UserProfile;
      }
    } catch (e) {
      console.warn('Error looking up partner code', e);
    }
    // Demo fallback
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

    try {
      await setDoc(doc(db, 'couples', coupleId), couple);
      // Update both user profiles
      await updateDoc(doc(db, 'users', user1.uid), { partnerId: partner.uid, coupleId });
      await updateDoc(doc(db, 'users', partner.uid), { partnerId: user1.uid, coupleId });
    } catch (e) {
      console.error('Error linking couple in Firestore', e);
    }

    return couple;
  },

  async getCouple(coupleId: string): Promise<Couple | null> {
    try {
      const snap = await getDoc(doc(db, 'couples', coupleId));
      if (snap.exists()) {
        return snap.data() as Couple;
      }
    } catch (e) {
      console.warn('Error getting couple', e);
    }
    if (coupleId === DEMO_COUPLE.coupleId) return DEMO_COUPLE;
    return null;
  },

  // --- ACCOUNTS ---
  async getAccounts(ownerId: string): Promise<BankAccount[]> {
    try {
      const q = query(collection(db, 'accounts'), where('ownerId', '==', ownerId));
      const snap = await getDocs(q);
      const accounts: BankAccount[] = [];
      snap.forEach(d => accounts.push(d.data() as BankAccount));
      return accounts;
    } catch (e) {
      console.warn('Error getting accounts from Firestore', e);
      return [];
    }
  },

  async saveAccount(account: BankAccount): Promise<void> {
    try {
      await setDoc(doc(db, 'accounts', account.accountId), account, { merge: true });
    } catch (e) {
      console.error('Error saving account to Firestore', e);
    }
  },

  async deleteAccount(accountId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'accounts', accountId));
    } catch (e) {
      console.error('Error deleting account from Firestore', e);
    }
  },

  // --- TRANSACTIONS ---
  subscribeTransactions(
    userId: string,
    coupleId: string | null,
    callback: (txs: Transaction[]) => void
  ) {
    try {
      const q = query(collection(db, 'transactions'));
      return onSnapshot(q, (snapshot) => {
        const txs: Transaction[] = [];
        snapshot.forEach(docSnap => {
          const t = docSnap.data() as Transaction;
          // Filter according to user/couple
          if (t.userId === userId || (coupleId && t.coupleId === coupleId)) {
            txs.push(t);
          }
        });
        txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(txs);
      }, (error) => {
        console.warn('Firestore subscription error', error);
        callback([]);
      });
    } catch (e) {
      console.warn('Failed to subscribe to transactions', e);
      callback([]);
      return () => {};
    }
  },

  async addTransaction(tx: Transaction): Promise<void> {
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
      console.error('Error adding transaction to Firestore', e);
    }
  },

  async deleteTransaction(transactionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'transactions', transactionId));
    } catch (e) {
      console.error('Error deleting transaction from Firestore', e);
    }
  },

  // --- BUDGETS ---
  async getBudgets(targetId: string): Promise<Budget[]> {
    try {
      const q = query(collection(db, 'budgets'), where('targetId', '==', targetId));
      const snap = await getDocs(q);
      const budgets: Budget[] = [];
      snap.forEach(d => budgets.push(d.data() as Budget));
      return budgets;
    } catch (e) {
      console.warn('Error getting budgets from Firestore', e);
      return [];
    }
  },

  async saveBudget(budget: Budget): Promise<void> {
    try {
      await setDoc(doc(db, 'budgets', budget.budgetId), budget, { merge: true });
    } catch (e) {
      console.error('Error saving budget to Firestore', e);
    }
  },

  async deleteBudget(budgetId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'budgets', budgetId));
    } catch (e) {
      console.error('Error deleting budget from Firestore', e);
    }
  },

  // --- WIPE / CLEAR ALL FIRESTORE DATA ---
  async clearDatabase(): Promise<void> {
    try {
      const collectionsToWipe = ['transactions', 'accounts', 'budgets'];
      for (const colName of collectionsToWipe) {
        const snap = await getDocs(collection(db, colName));
        for (const d of snap.docs) {
          await deleteDoc(doc(db, colName, d.id));
        }
      }
      console.log('Database cleared completely (started from 0)!');
    } catch (e) {
      console.error('Error clearing Firestore database:', e);
    }
  },

  // --- SEED DEMO DATA TO FIRESTORE ---
  async seedDemoData(user1: UserProfile, partner?: UserProfile | null): Promise<void> {
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

      console.log('Demo data successfully seeded to Firestore!');
    } catch (e) {
      console.error('Error seeding demo data to Firestore', e);
    }
  }
};
