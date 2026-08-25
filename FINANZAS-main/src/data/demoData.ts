import { UserProfile, Couple, BankAccount, Transaction, Budget } from '../types';

export const DEMO_USER_1: UserProfile = {
  uid: 'demo_user_1',
  email: 'carlos@ejemplo.com',
  displayName: 'Carlos Rodríguez',
  partnerId: 'demo_user_2',
  coupleId: 'demo_couple_1',
  inviteCode: 'PAREJA-7A92',
  currency: 'USD',
  createdAt: new Date().toISOString(),
};

export const DEMO_USER_2: UserProfile = {
  uid: 'demo_user_2',
  email: 'maria@ejemplo.com',
  displayName: 'María López',
  partnerId: 'demo_user_1',
  coupleId: 'demo_couple_1',
  inviteCode: 'PAREJA-3B14',
  currency: 'USD',
  createdAt: new Date().toISOString(),
};

export const DEMO_COUPLE: Couple = {
  coupleId: 'demo_couple_1',
  user1Id: 'demo_user_1',
  user2Id: 'demo_user_2',
  user1Name: 'Carlos Rodríguez',
  user2Name: 'María López',
  status: 'active',
  createdAt: new Date().toISOString(),
};

export const DEMO_ACCOUNTS: BankAccount[] = [];

export const DEMO_BUDGETS: Budget[] = [];

export const DEMO_TRANSACTIONS: Transaction[] = [];
