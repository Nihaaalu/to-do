import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { IStorageService, UserProfile, UserSettings } from './interfaces';
import { Task } from '../types';

export class FirebaseStorageService implements IStorageService {
  // Tasks stored in localStorage mapped to user's UID
  public async loadTasks(uid: string): Promise<Task[]> {
    const data = localStorage.getItem(`todo-tasks-${uid}`);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('[FIREBASE STORAGE] Failed to parse user tasks from localStorage', e);
      }
    }
    // Fallback: If transitioning, try loading from global 'todo-tasks'
    const globalData = localStorage.getItem('todo-tasks');
    if (globalData) {
      try {
        const tasks = JSON.parse(globalData);
        // Save as user-specific and clear global to prevent conflict
        localStorage.setItem(`todo-tasks-${uid}`, globalData);
        localStorage.removeItem('todo-tasks');
        return tasks;
      } catch (e) {
        // ignore
      }
    }
    return [];
  }

  public async saveTasks(uid: string, tasks: Task[]): Promise<void> {
    localStorage.setItem(`todo-tasks-${uid}`, JSON.stringify(tasks));
  }

  // Settings stored in localStorage mapped to user's UID
  public async loadSettings(uid: string): Promise<UserSettings> {
    const data = localStorage.getItem(`todo-settings-${uid}`);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('[FIREBASE STORAGE] Failed to parse settings', e);
      }
    }
    return {};
  }

  public async saveSettings(uid: string, settings: UserSettings): Promise<void> {
    localStorage.setItem(`todo-settings-${uid}`, JSON.stringify(settings));
  }

  // Profile loaded directly from Firestore database
  public async loadProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          uid: data.uid,
          email: data.email || null,
          displayName: data.fullName || null,
          photoURL: '',
          name: data.fullName || '',
          dob: data.dob || '',
          gender: data.gender || 'Unspecified',
          country: data.country || 'India',
          timezone: data.timezone || 'UTC',
          theme: data.theme || 'dark',
          notificationPrefs: data.notificationPrefs || {
            minutesBefore30: true,
            minutesBefore15: true,
            minutesBefore5: true,
            atDeadline: true
          }
        };
      }
    } catch (e) {
      console.error('[FIREBASE STORAGE] Error loading profile from Firestore', e);
    }
    return null;
  }

  // Profile saved directly to Firestore database
  public async saveProfile(uid: string, profile: UserProfile): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      const updateData: any = {
        fullName: profile.name || profile.displayName || 'User',
        email: profile.email,
        dob: profile.dob || '',
        gender: profile.gender || 'Unspecified',
        country: profile.country || 'India',
        timezone: profile.timezone || 'UTC',
        theme: profile.theme || 'dark',
        notificationPrefs: profile.notificationPrefs || {
          minutesBefore30: true,
          minutesBefore15: true,
          minutesBefore5: true,
          atDeadline: true
        },
        updatedAt: serverTimestamp()
      };

      if (docSnap.exists()) {
        await updateDoc(docRef, updateData);
      } else {
        await setDoc(docRef, {
          uid,
          createdAt: serverTimestamp(),
          provider: profile.provider || 'password',
          ...updateData
        });
      }
    } catch (e) {
      console.error('[FIREBASE STORAGE] Error saving profile to Firestore', e);
      throw e;
    }
  }

  // Profile photo upload is disabled, so return empty
  public async uploadProfileImage(uid: string, blob: Blob, onProgress: (progress: number) => void): Promise<string> {
    console.warn('[FIREBASE STORAGE] Profile photo upload is disabled.');
    return '';
  }
}
