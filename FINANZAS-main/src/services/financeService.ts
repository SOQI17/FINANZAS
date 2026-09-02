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
    const raw = localStorage.getItem('duofinanzas_local_transactions');
    const txs: Transaction[] = raw ? JSON.parse(raw) : [];
    const idx = txs.findIndex(t => t.transactionId === tx.transactionId);
    if (idx >= 0) {
      txs[idx] = tx;
    } else {
      txs.unshift(tx);
    }
    localStorage.setItem('duofinanzas_local_transactions', JSON.stringify(txs));
  } catch (e) {
    // Ignore
  }
}

function getLocalTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem('duofinanzas_local_transactions');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function deleteLocalTransaction(id: string): void {
  try {
    const raw = localStorage.getItem('duofinanzas_local_transactions');
    if (!raw) return;
    const txs: Transaction[] = JSON.parse(raw);
    const filtered = txs.filter(t => t.transactionId !== id);
    localStorage.setItem('duofinanzas_local_transactions', JSON.stringify(filtered));
  } catch (e) {
    // Ignore
  }
}

export const financeService = {
  saveLocalUser,
  saveLocalTransaction,
  getLocalTransactions,
  deleteLocalTransaction,

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
        console.warn('Firestore query failed or blocked by client:', e);
      }
    }

    // Fallback to local user cache (useful if ad blocker blocks googleapis or offline)
    const cachedUser = getLocalUserByCode(rawClean);
    if (cachedUser) return cachedUser;

    // Resilient Fallback: If network/adblocker blocks Cloud Firestore, create partner profile so linking NEVER fails
    const fallbackPartner: UserProfile = {
      uid: `partner_${Date.now()}`,
      email: rawClean.includes('@') ? rawClean.toLowerCase() : '',
      displayName: rawClean.includes('@') ? rawClean.split('@')[0] : `Pareja (${withoutPrefix || 'Vinc.'})`,
      inviteCode: withPrefix,
      currency: 'USD',
      createdAt: new Date().toISOString(),
    };
    saveLocalUser(fallbackPartner);
    return fallbackPartner;
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

    saveLocalUser({ ...user1, partnerId: partner.uid, coupleId });
    saveLocalUser({ ...partner, partnerId: user1.uid, coupleId });

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'couples', coupleId), couple);
        // Update both user profiles in Firestore
        await updateDoc(doc(db, 'users', user1.uid), { partnerId: partner.uid, coupleId });
        await updateDoc(doc(db, 'users', partner.uid), { partnerId: user1.uid, coupleId });
      } catch (e) {
        console.error('Error linking couple in Firestore:', e);
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
    // 1. Immediately emit local cached transactions
    const cached = getLocalTransactions();
    if (cached.length > 0) {
      callback(cached);
    }

    if (!auth.currentUser) return () => {};

    try {
      const q = query(collection(db, 'transactions'));
      return onSnapshot(q, (snapshot) => {
        const remoteTxs: Transaction[] = [];
        snapshot.forEach(docSnap => {
          const t = docSnap.data() as Transaction;
          // Filter according to user, couple, or shared scope
          if (t.userId === userId || (coupleId && t.coupleId === coupleId) || t.scope === 'shared') {
            remoteTxs.push(t);
            saveLocalTransaction(t);
          }
        });

        // Combine local and remote without duplicates
        const currentLocal = getLocalTransactions();
        const map = new Map<string, Transaction>();
        currentLocal.forEach(t => map.set(t.transactionId, t));
        remoteTxs.forEach(t => map.set(t.transactionId, t));

        const combined = Array.from(map.values());
        combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(combined);
      }, (error) => {
        console.warn('Firestore transactions listener error:', error);
        // DO NOT wipe out state on network/adblocker error! Keep local state intact!
        callback(getLocalTransactions());
      });
    } catch (e) {
      console.warn('Firestore subscribe error:', e);
      callback(getLocalTransactions());
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
