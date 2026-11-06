import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { auth, db } from '../firebase';
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
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  linkPartnerWithCode: (code: string) => Promise<{ success: boolean; message: string }>;
  updatePartnerName: (newName: string) => Promise<void>;
  unlinkPartner: () => Promise<void>;
  seedFirestore: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Load partner and couple details. A partner only counts when BOTH profiles point to each
  // other; one-sided or stale links (e.g. left by older versions) are ignored, but never
  // deleted here: a failed or temporary read must not destroy a real link.
  // The only way to get a partner is linking with an invite code.
  const refreshRelationship = async (currentUser: UserProfile) => {
    const pId = currentUser.partnerId;
    const cId = currentUser.coupleId;

    let partnerProfile: UserProfile | null = pId ? await financeService.getUserProfile(pId) : null;

    const isMutualLink = Boolean(
      partnerProfile &&
      partnerProfile.uid !== currentUser.uid &&
      partnerProfile.partnerId === currentUser.uid
    );
    if (!isMutualLink) {
      partnerProfile = null;
    }

    // Users without a partner start alone: no partner and no couple
    if (!partnerProfile) {
      setPartner(null);
      setCouple(null);
      return;
    }

    let coupleDoc: Couple | null = cId ? await financeService.getCouple(cId) : null;
    const memberIds = [currentUser.uid, partnerProfile.uid];
    const coupleMatches = Boolean(
      coupleDoc &&
      coupleDoc.user1Id !== coupleDoc.user2Id &&
      memberIds.includes(coupleDoc.user1Id) &&
      memberIds.includes(coupleDoc.user2Id || '')
    );

    if (!coupleMatches) {
      coupleDoc = {
        coupleId: cId || partnerProfile.coupleId || `couple_${[...memberIds].sort().join('_')}`,
        user1Id: currentUser.uid,
        user2Id: partnerProfile.uid,
        user1Name: currentUser.displayName || 'Usuario',
        user2Name: partnerProfile.displayName || 'Pareja',
        status: 'active',
        createdAt: new Date().toISOString()
      };
    }

    setPartner(partnerProfile);
    setCouple(coupleDoc);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setIsDemoMode(false);

        const profile = await financeService.getUserProfile(fbUser.uid);
        const fallbackName = fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Usuario');

        if (profile) {
          const sanitizedProfile: UserProfile = {
            ...profile,
            email: fbUser.email || profile.email,
            displayName: profile.displayName || fallbackName,
          };
          setUser(sanitizedProfile);
          await refreshRelationship(sanitizedProfile);
        } else {
          // New user profile
          const newProfile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fallbackName,
            inviteCode: generateInviteCode(),
            currency: 'USD',
            createdAt: new Date().toISOString(),
          };
          await financeService.createUserProfile(newProfile);
          setUser(newProfile);
          setPartner(null);
          setCouple(null);
        }
      } else {
        setUser(null);
        setPartner(null);
        setCouple(null);
        setIsDemoMode(false);
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

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Configure custom parameters if needed
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      setIsDemoMode(false);
      
      const profile = await financeService.getUserProfile(cred.user.uid);
      if (profile) {
        setUser(profile);
        await refreshRelationship(profile);
      } else {
        const newProfile: UserProfile = {
          uid: cred.user.uid,
          email: cred.user.email || '',
          displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'Usuario',
          inviteCode: generateInviteCode(),
          currency: 'USD',
          createdAt: new Date().toISOString(),
        };
        await financeService.createUserProfile(newProfile);
        setUser(newProfile);
        setPartner(null);
        setCouple(null);
      }
    } catch (e: any) {
      console.error('Error initiating Google Auth:', e);
      // Handle pop-up blocked or closed by user gracefully
      if (e.code === 'auth/popup-closed-by-user') {
        throw new Error('Inicio de sesión cancelado.');
      } else if (e.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        throw new Error(`Dominio no autorizado (${currentDomain}). Por favor añade "${currentDomain}" en Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
      }
      throw new Error(e.message || 'Error al iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (!email.trim()) {
      throw new Error('Por favor ingresa tu correo electrónico.');
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        throw new Error('No existe una cuenta registrada con este correo electrónico.');
      } else if (e.code === 'auth/invalid-email') {
        throw new Error('El correo electrónico ingresado no es válido.');
      }
      throw new Error(e.message || 'Error al enviar el correo de recuperación.');
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
    setUser(null);
    setPartner(null);
    setCouple(null);
    setIsDemoMode(false);
  };

  const linkPartnerWithCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Usuario no autenticado' };

    const rawClean = code.trim().toUpperCase();
    const clean = rawClean.replace(/[^A-Z0-9-]/g, '');
    const withPrefix = clean.startsWith('PAREJA-') ? clean : `PAREJA-${clean}`;
    const userInviteClean = user.inviteCode.trim().toUpperCase();

    if (rawClean === userInviteClean || withPrefix === userInviteClean) {
      return { success: false, message: 'No puedes vincular tu propio código de invitación.' };
    }

    const partnerProfile = await financeService.findUserByInviteCode(code);
    if (!partnerProfile) {
      return { success: false, message: 'Usuario no encontrado. Tu pareja debe registrarse primero en la app para poder vincularse.' };
    }

    if (partnerProfile.uid === user.uid) {
      return { success: false, message: 'No puedes vincular tu propio código de invitación.' };
    }

    // Already linked to someone else? Only if that other person also points back to them;
    // a one-sided (stale) link doesn't block a new link.
    if (partnerProfile.partnerId && partnerProfile.partnerId !== user.uid) {
      const theirPartner = await financeService.getUserProfile(partnerProfile.partnerId);
      if (theirPartner && theirPartner.partnerId === partnerProfile.uid) {
        return { success: false, message: 'Este usuario ya está vinculado a otra pareja.' };
      }
    }

    // Link in Firestore and Local Storage
    const newCouple = await financeService.linkCouple(user, partnerProfile);
    
    // Update local state and persistent storage
    const updatedUser: UserProfile = {
      ...user,
      partnerId: partnerProfile.uid,
      coupleId: newCouple.coupleId
    };
    const updatedPartner: UserProfile = {
      ...partnerProfile,
      partnerId: user.uid,
      coupleId: newCouple.coupleId
    };

    setUser(updatedUser);
    setPartner(updatedPartner);
    setCouple(newCouple);

    financeService.saveLocalUser(updatedUser);
    financeService.saveLocalUser(updatedPartner);
    financeService.saveLocalCouple(newCouple);

    return { success: true, message: `¡Felicidades! Te has vinculado exitosamente con ${updatedPartner.displayName}.` };
  };

  const updatePartnerName = async (newName: string) => {
    if (!partner || !newName.trim()) return;
    const cleanName = newName.trim();
    const updatedPartner: UserProfile = {
      ...partner,
      displayName: cleanName,
    };
    setPartner(updatedPartner);

    if (couple) {
      const isUser1 = couple.user1Id === user?.uid;
      const updatedCouple: Couple = {
        ...couple,
        user1Name: isUser1 ? (user?.displayName || couple.user1Name) : cleanName,
        user2Name: isUser1 ? cleanName : (user?.displayName || couple.user2Name || ''),
      };
      setCouple(updatedCouple);
    }

    financeService.saveLocalUser(updatedPartner);
  };

  const unlinkPartner = async () => {
    if (!user) return;

    const currentPartner = partner;

    const unlinkedUser: UserProfile = {
      ...user,
      partnerId: undefined,
      coupleId: undefined,
    };

    setUser(unlinkedUser);
    setPartner(null);
    setCouple(null);

    financeService.saveLocalUser(unlinkedUser);
    try {
      localStorage.removeItem('duofinanzas_known_couples');
    } catch (e) {}

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          partnerId: deleteField(),
          coupleId: deleteField(),
        });
        // The partner keeps their coupleId and the couple document is kept, so if they link
        // again (with this or another account) their shared accounts and budgets are reused.
        if (currentPartner?.uid) {
          await updateDoc(doc(db, 'users', currentPartner.uid), {
            partnerId: deleteField(),
          });
        }
      } catch (e) {
        console.warn('Could not unlink in Firestore:', e);
      }
    }
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
        signInWithGoogle,
        resetPassword,
        signOutUser,
        linkPartnerWithCode,
        updatePartnerName,
        unlinkPartner,
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
