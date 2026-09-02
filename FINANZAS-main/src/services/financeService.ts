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

function saveLocalUser(profile: UserProfile): void {
  try {
    const raw = localStorage.getItem('duofinanzas_known_users');
    const users: UserProfile[] = raw ? JSON.parse(raw) : [];
    const idx = users.findIndex(u => u.uid === profile.uid || u.inviteCode === profile.inviteCode);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...profile };
    } else {
      users.push(profile);
    }
    localStorage.setItem('duofinanzas_known_users', JSON.stringify(users));
  } catch (e) {
    // Ignore
  }
}

function getLocalUserByCode(code: string): UserProfile | null {
  try {
    const rawClean = code.trim().toUpperCase();
    if (!rawClean) return null;
    const clean = rawClean.replace(/[^A-Z0-9-]/g, '');
    const withPrefix = clean.startsWith('PAREJA-') ? clean : `PAREJA-${clean}`;
    const withoutPrefix = clean.replace(/^PAREJA-/, '');

    const candidates = [rawClean, clean, withPrefix, withoutPrefix];

    const raw = localStorage.getItem('duofinanzas_known_users');
    if (!raw) return null;
    const users: UserProfile[] = JSON.parse(raw);

    for (const u of users) {
      if (!u.inviteCode) continue;
      const uCode = u.inviteCode.trim().toUpperCase();
      if (candidates.includes(uCode) || candidates.includes(uCode.replace(/^PAREJA-/, ''))) {
        return u;
      }
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

function saveLocalTransaction(tx: Transaction): void {
  try {
    const uid = auth.currentUser?.uid || tx.userId || 'user_1';
    const key = `duofinanzas_local_txs_${uid}`;
    const raw = localStorage.getItem(key);
    const txs: Transaction[] = raw ? JSON.parse(raw) : [];
    const idx = txs.findIndex(t => t.transactionId === tx.transactionId);
    if (idx >= 0) {
      txs[idx] = tx;
    } else {
      txs.unshift(tx);
    }
    localStorage.setItem(key, JSON.stringify(txs));
  } catch (e) {
    // Ignore
  }
}

function getLocalTransactions(userId?: string): Transaction[] {
  try {
    const uid = userId || auth.currentUser?.uid || 'user_1';
    const key = `duofinanzas_local_txs_${uid}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function deleteLocalTransaction(id: string): void {
  try {
    const uid = auth.currentUser?.uid || 'user_1';
    const key = `duofinanzas_local_txs_${uid}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const txs: Transaction[] = JSON.parse(raw);
    const filtered = txs.filter(t => t.transactionId !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (e) {
    // Ignore
  }
}

function saveLocalCouple(couple: Couple): void {
  try {
    const raw = localStorage.getItem('duofinanzas_known_couples');
    const couples: Couple[] = raw ? JSON.parse(raw) : [];
    const idx = couples.findIndex(c => c.coupleId === couple.coupleId || c.user1Id === couple.user1Id || c.user2Id === couple.user1Id);
    if (idx >= 0) {
      couples[idx] = couple;
    } else {
      couples.push(couple);
    }
    localStorage.setItem('duofinanzas_known_couples', JSON.stringify(couples));
  } catch (e) {
    // Ignore
  }
}

function getLocalCouple(coupleId: string): Couple | null {
  try {
    const raw = localStorage.getItem('duofinanzas_known_couples');
    if (!raw) return null;
    const couples: Couple[] = JSON.parse(raw);
    return couples.find(c => c.coupleId === coupleId || c.user1Id === coupleId || c.user2Id === coupleId) || null;
  } catch (e) {
    return null;
  }
}

function migrateLocalTransactionsToUser(newUid: string, displayName?: string): void {
  // Real new users start with 0 transactions and clean database
  return;
}

export const financeService = {
  saveLocalUser,
  saveLocalTransaction,
  getLocalTransactions,
  deleteLocalTransaction,
  saveLocalCouple,
  getLocalCouple,
  migrateLocalTransactionsToUser,

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
        const prof = snap.data() as UserProfile;
        saveLocalUser(prof);
        return prof;
      }
    } catch (e) {
      // Silently fall back if ad blocker or permission blocks request
    }
    if (uid === DEMO_USER_1.uid) return DEMO_USER_1;
    if (uid === DEMO_USER_2.uid) return DEMO_USER_2;
    return null;
  },

  async createUserProfile(profile: UserProfile): Promise<void> {
    saveLocalUser(profile);
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
    } catch (e) {
      // Silently fall back if ad blocker or permission blocks request
    }
  },

  async findUserByInviteCode(inviteCode: string): Promise<UserProfile | null> {
    const rawClean = inviteCode.trim();
    if (!rawClean) return null;

    const upperClean = rawClean.toUpperCase();
    const clean = upperClean.replace(/[^A-Z0-9-]/g, '');
    const withPrefix = clean.startsWith('PAREJA-') ? clean : `PAREJA-${clean}`;
    const withoutPrefix = clean.replace(/^PAREJA-/, '');

    // Demo Account Check
    if (
      upperClean === DEMO_USER_1.inviteCode ||
      withPrefix === DEMO_USER_1.inviteCode ||
      withoutPrefix === DEMO_USER_1.inviteCode.replace('PAREJA-', '')
    ) {
      return DEMO_USER_1;
    }
    if (
      upperClean === DEMO_USER_2.inviteCode ||
      withPrefix === DEMO_USER_2.inviteCode ||
      withoutPrefix === DEMO_USER_2.inviteCode.replace('PAREJA-', '')
    ) {
      return DEMO_USER_2;
    }

    // Try Firestore query first if user authenticated
    if (auth.currentUser) {
      try {
        const candidates = Array.from(new Set([withPrefix, upperClean, clean, withoutPrefix]));

        for (const code of candidates) {
          if (!code) continue;
          const q = query(collection(db, 'users'), where('inviteCode', '==', code));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const prof = snap.docs[0].data() as UserProfile;
            saveLocalUser(prof);
            return prof;
          }
        }

        // Also try searching by email if input is an email
        if (rawClean.includes('@')) {
          const qEmail = query(collection(db, 'users'), where('email', '==', rawClean.toLowerCase()));
          const snapEmail = await getDocs(qEmail);
          if (!snapEmail.empty) {
            const prof = snapEmail.docs[0].data() as UserProfile;
            saveLocalUser(prof);
            return prof;
          }
        }
      } catch (e) {
        // Silently fall back to local cache if network/permission error
      }
    }

    // Fallback to local user cache (useful if ad blocker blocks googleapis or offline)
    const cachedUser = getLocalUserByCode(rawClean);
    if (cachedUser) return cachedUser;

    // Strict Rule: Return null if no registered user exists
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

    const updatedUser1: UserProfile = { ...user1, partnerId: partner.uid, coupleId };
    const updatedUser2: UserProfile = { ...partner, partnerId: user1.uid, coupleId };

    saveLocalUser(updatedUser1);
    saveLocalUser(updatedUser2);
    saveLocalCouple(couple);

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'couples', coupleId), couple);
        await setDoc(doc(db, 'users', user1.uid), updatedUser1, { merge: true });
        await setDoc(doc(db, 'users', partner.uid), updatedUser2, { merge: true });
      } catch (e) {
        // Silently fall back locally
      }
    }

    return couple;
  },

  async getCouple(coupleId: string): Promise<Couple | null> {
    const localCouple = getLocalCouple(coupleId);
    if (!auth.currentUser) {
      if (localCouple) return localCouple;
      if (coupleId === DEMO_COUPLE.coupleId) return DEMO_COUPLE;
      return null;
    }
    try {
      const snap = await getDoc(doc(db, 'couples', coupleId));
      if (snap.exists()) {
        const c = snap.data() as Couple;
        saveLocalCouple(c);
        return c;
      }
    } catch (e) {
      // Fall back
    }
    if (localCouple) return localCouple;
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
    // 1. Immediately emit local cached transactions for THIS user
    const cached = getLocalTransactions(userId);
    callback(cached);

    if (!auth.currentUser) return () => {};

    try {
      const q = query(collection(db, 'transactions'));
      return onSnapshot(q, (snapshot) => {
        const remoteTxs: Transaction[] = [];
        snapshot.forEach(docSnap => {
          const t = docSnap.data() as Transaction;
          // Strictly filter: ONLY transactions belonging to this user, paid by this user, or matching the coupleId!
          const isUserTx = t.userId === userId || t.paidBy === userId;
          const isCoupleTx = Boolean(coupleId && t.coupleId === coupleId);

          if (isUserTx || isCoupleTx) {
            remoteTxs.push(t);
            saveLocalTransaction(t);
          }
        });

        // Combine local and remote for THIS user
        const currentLocal = getLocalTransactions(userId);
        const map = new Map<string, Transaction>();
        currentLocal.forEach(t => {
          if (t.userId === userId || t.paidBy === userId || (coupleId && t.coupleId === coupleId)) {
            map.set(t.transactionId, t);
          }
        });
        remoteTxs.forEach(t => map.set(t.transactionId, t));

        const combined = Array.from(map.values());
        combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(combined);
      }, (error) => {
        // Keep local state intact on error
        callback(getLocalTransactions(userId));
      });
    } catch (e) {
      callback(getLocalTransactions(userId));
      return () => {};
    }
  },

  async addTransaction(tx: Transaction): Promise<void> {
    saveLocalTransaction(tx);
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
      console.warn('Could not save transaction to Firestore:', e);
    }
  },

  async deleteTransaction(transactionId: string): Promise<void> {
    deleteLocalTransaction(transactionId);
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'transactions', transactionId));
    } catch (e) {
      console.warn('Could not delete transaction from Firestore:', e);
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
