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
    // Eagerly check redirect result on application startup
    this.handleRedirectResult().catch((err) => {
      console.warn('[AUTH] Startup redirect result check status:', err?.message || err);
    });
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
    } as any; // Cast as any to allow custom fields
  }

  private async createOrUpdateUserDoc(user: User, provider: 'google' | 'password', fullName?: string) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      const name = fullName || user.displayName || user.email?.split('@')[0] || 'User';

      if (!userSnap.exists()) {
        // First-time login: create the document
        await setDoc(userRef, {
          uid: user.uid,
          fullName: name,
          email: user.email,
          provider,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          // Also save initial profile settings default
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
        // Subsequent logins: update updatedAt
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
        console.log('[AUTH] Checking redirect result');
        try {
          const result = await getRedirectResult(auth);
          this.redirectHandled = true;
          if (result && result.user) {
            console.log('[AUTH] Google redirect sign-in successful');
            await this.createOrUpdateUserDoc(result.user, 'google');
            this.currentUser = this.mapFirebaseUserToProfile(result.user);
            return this.currentUser;
          }
          return null;
        } catch (error: any) {
          this.redirectHandled = true;
          console.error('[AUTH] Google redirect sign-in failed');
          console.error('[AUTH] Error code:', error?.code || 'unknown');
          console.error('[AUTH] Error message:', error?.message || String(error));
          throw error;
        }
      })();
    }

    return this.redirectPromise;
  }

  public async signInWithGoogle(): Promise<void> {
    console.log('[AUTH] Starting Google redirect sign-in');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      console.log('[AUTH] Google redirect initiated');
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error('[AUTH] Google redirect sign-in failed');
      console.error('[AUTH] Error code:', error?.code || 'unknown');
      console.error('[AUTH] Error message:', error?.message || String(error));
      throw error;
    }
  }

  public async signUpWithEmail(email: string, password: string, fullName: string): Promise<UserProfile> {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update auth display name
    await updateProfile(result.user, { displayName: fullName });
    
    // Create Firestore document
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
