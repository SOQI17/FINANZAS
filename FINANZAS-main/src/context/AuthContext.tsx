import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile, Couple } from '../types';
import { financeService, generateInviteCode } from '../services/financeService';
import { DEMO_USER_1, DEMO_USER_2, DEMO_COUPLE } from '../data/demoData';

interface AuthContextType {
  user: UserProfile | null;
  partner: UserProfile | null;
  couple: Couple | null;
  loading: boolean;
  isDemoMode: boolean;
  signInDemoUser: (userNum?: 1 | 2) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  linkPartnerWithCode: (code: string) => Promise<{ success: boolean; message: string }>;
  seedFirestore: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(DEMO_USER_1);
  const [partner, setPartner] = useState<UserProfile | null>(DEMO_USER_2);
  const [couple, setCouple] = useState<Couple | null>(DEMO_COUPLE);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Load partner and couple details if user has coupleId/partnerId
  const refreshRelationship = async (currentUser: UserProfile) => {
    if (currentUser.partnerId) {
      const partnerProfile = await financeService.getUserProfile(currentUser.partnerId);
      setPartner(partnerProfile || (currentUser.partnerId === DEMO_USER_2.uid ? DEMO_USER_2 : null));
    } else {
      setPartner(null);
    }

    if (currentUser.coupleId) {
      const coupleDoc = await financeService.getCouple(currentUser.coupleId);
      setCouple(coupleDoc || (currentUser.coupleId === DEMO_COUPLE.coupleId ? DEMO_COUPLE : null));
    } else {
      setCouple(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setIsDemoMode(false);
        const profile = await financeService.getUserProfile(fbUser.uid);
        if (profile) {
          setUser(profile);
          await refreshRelationship(profile);
        } else {
          // New user profile
          const newProfile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuario',
            inviteCode: generateInviteCode(),
            currency: 'USD',
            createdAt: new Date().toISOString(),
          };
          await financeService.createUserProfile(newProfile);
          setUser(newProfile);
          setPartner(null);
          setCouple(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInDemoUser = async (userNum: 1 | 2 = 1) => {
    setIsDemoMode(true);
    if (userNum === 1) {
      setUser(DEMO_USER_1);
      setPartner(DEMO_USER_2);
      setCouple(DEMO_COUPLE);
    } else {
      setUser(DEMO_USER_2);
      setPartner(DEMO_USER_1);
      setCouple(DEMO_COUPLE);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        email,
        displayName,
        inviteCode: generateInviteCode(),
        currency: 'USD',
        createdAt: new Date().toISOString(),
      };
      await financeService.createUserProfile(newProfile);
      setUser(newProfile);
      setPartner(null);
      setCouple(null);
      setIsDemoMode(false);
    } catch (e: any) {
      throw new Error(e.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      setIsDemoMode(false);
      const profile = await financeService.getUserProfile(cred.user.uid);
      if (profile) {
        setUser(profile);
        await refreshRelationship(profile);
      }
    } catch (e: any) {
      throw new Error(e.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Signout error', e);
    }
    // Default to demo user
    signInDemoUser(1);
  };

  const linkPartnerWithCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Usuario no autenticado' };

    if (code.trim().toUpperCase() === user.inviteCode) {
      return { success: false, message: 'No puedes vincular tu propio código de invitación.' };
    }

    const partnerProfile = await financeService.findUserByInviteCode(code);
    if (!partnerProfile) {
      return { success: false, message: 'Código de invitación no válido o usuario no encontrado.' };
    }

    if (partnerProfile.partnerId && partnerProfile.partnerId !== user.uid) {
      return { success: false, message: 'Este usuario ya está vinculado a otra pareja.' };
    }

    // Link in Firestore
    const newCouple = await financeService.linkCouple(user, partnerProfile);
    
    // Update local state
    const updatedUser: UserProfile = {
      ...user,
      partnerId: partnerProfile.uid,
      coupleId: newCouple.coupleId
    };
    setUser(updatedUser);
    setPartner(partnerProfile);
    setCouple(newCouple);

    return { success: true, message: `¡Felicidades! Te has vinculado exitosamente con ${partnerProfile.displayName}.` };
  };

  const seedFirestore = async () => {
    if (!user) return;
    setLoading(true);
    await financeService.seedDemoData(user, partner);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        partner,
        couple,
        loading,
        isDemoMode,
        signInDemoUser,
        signUpWithEmail,
        signInWithEmail,
        signOutUser,
        linkPartnerWithCode,
        seedFirestore,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
