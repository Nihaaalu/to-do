import { 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut as firebaseSignOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged, 
  updateProfile,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { IAuthService, UserProfile } from './interfaces';

export class FirebaseAuthService implements IAuthService {
  private currentUser: UserProfile | null = null;
  private redirectHandled = false;
  private redirectPromise: Promise<UserProfile | null> | null = null;

  constructor() {
    // Constructor initializes cleanly without firing background side-effects.
    // Redirect result is handled deterministically by the application startup coordinator.
  }

  private mapFirebaseUserToProfile(user: User): UserProfile {
    // Determine provider
    const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
    const provider = isGoogle ? 'google' : 'password';

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || '',
      name: user.displayName || user.email?.split('@')[0] || 'User',
      provider
    } as any;
  }

  private async createOrUpdateUserDoc(user: User, provider: 'google' | 'password', fullName?: string) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      const name = fullName || user.displayName || user.email?.split('@')[0] || 'User';

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          fullName: name,
          email: user.email,
          provider,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          dob: '',
          gender: 'Unspecified',
          country: 'India',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          theme: 'dark',
          notificationPrefs: {
            minutesBefore30: true,
            minutesBefore15: true,
            minutesBefore5: true,
            atDeadline: true
          }
        });
      } else {
        await updateDoc(userRef, {
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.warn('[AUTH] Note: Failed to update user doc in Firestore (non-fatal):', err);
    }
  }

  public async handleRedirectResult(): Promise<UserProfile | null> {
    if (this.redirectHandled) {
      return this.currentUser;
    }

    if (!this.redirectPromise) {
      this.redirectPromise = (async () => {
        try {
          console.log('[AUTH] Checking getRedirectResult(auth)...');
          const result = await getRedirectResult(auth);
          this.redirectHandled = true;

          if (result && result.user) {
            console.log('[AUTH] getRedirectResult returned user UID:', result.user.uid);
            console.log('[AUTH] Google redirect authentication successful');
            await this.createOrUpdateUserDoc(result.user, 'google');
            this.currentUser = this.mapFirebaseUserToProfile(result.user);
            return this.currentUser;
          }

          console.log('[AUTH] getRedirectResult returned null (no redirect in progress)');
          return null;
        } catch (error: any) {
          this.redirectHandled = true;
          console.error('[AUTH] getRedirectResult error:', error.code || 'UNKNOWN', error.message || error);
          throw error;
        }
      })();
    }

    return this.redirectPromise;
  }

  public async signInWithGoogle(): Promise<UserProfile | null> {
    console.log('[AUTH] Starting Google signInWithRedirect...');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithRedirect(auth, provider);
      return null;
    } catch (error: any) {
      console.error('[AUTH] Google signInWithRedirect error:', error.code || 'UNKNOWN', error.message || error);
      throw error;
    }
  }

  public async signUpWithEmail(email: string, password: string, fullName: string): Promise<UserProfile> {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: fullName });
    await this.createOrUpdateUserDoc(result.user, 'password', fullName);
    this.currentUser = this.mapFirebaseUserToProfile(result.user);
    return this.currentUser;
  }

  public async signInWithEmail(email: string, password: string): Promise<UserProfile> {
    const result = await signInWithEmailAndPassword(auth, email, password);
    this.currentUser = this.mapFirebaseUserToProfile(result.user);
    return this.currentUser;
  }

  public async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  public async signOut(): Promise<void> {
    await firebaseSignOut(auth);
    this.currentUser = null;
  }

  public onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, async (user) => {
      console.log('[AUTH] onAuthStateChanged fired. User:', user ? `UID: ${user.uid}` : 'null');
      if (user) {
        this.currentUser = this.mapFirebaseUserToProfile(user);
        callback(this.currentUser);
      } else {
        this.currentUser = null;
        callback(null);
      }
    });
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }
}
