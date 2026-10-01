import { IAuthService, IStorageService, UserProfile, UserSettings } from './interfaces';
import { Task } from '../types';

const DEFAULT_PROFILE: UserProfile = {
  uid: 'local-user',
  email: 'mahammadnihal12@gmail.com',
  displayName: 'Nihal',
  photoURL: '',
  name: 'Nihal',
  dob: '',
  gender: 'Unspecified',
  country: 'India',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  theme: 'dark',
  notificationPrefs: {
    minutesBefore30: true,
    minutesBefore15: true,
    minutesBefore5: true,
    atDeadline: true,
  },
};

export class LocalAuthService implements IAuthService {
  private currentUser: UserProfile | null = null;
  private listeners: Array<(user: UserProfile | null) => void> = [];

  constructor() {
    // Load local profile if it exists, otherwise use DEFAULT_PROFILE
    const saved = localStorage.getItem('todo-profile');
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch (e) {
        this.currentUser = { ...DEFAULT_PROFILE };
      }
    } else {
      this.currentUser = { ...DEFAULT_PROFILE };
      localStorage.setItem('todo-profile', JSON.stringify(DEFAULT_PROFILE));
    }
  }

  public async signInWithGoogle(): Promise<UserProfile> {
    // Handled purely offline
    return this.currentUser || { ...DEFAULT_PROFILE };
  }

  public async handleRedirectResult(): Promise<UserProfile | null> {
    return null;
  }

  public async signUpWithEmail(email: string, password: string, fullName: string): Promise<UserProfile> {
    const user = { ...DEFAULT_PROFILE, email, displayName: fullName, name: fullName };
    this.currentUser = user;
    return user;
  }

  public async signInWithEmail(email: string, password: string): Promise<UserProfile> {
    return this.currentUser || { ...DEFAULT_PROFILE };
  }

  public async sendPasswordReset(email: string): Promise<void> {
    console.log('[LOCAL AUTH] Send password reset for', email);
  }

  public async signOut(): Promise<void> {
    // Sign out does nothing in standard offline mode or simply resets
    console.log('[LOCAL AUTH] Sign out requested, maintaining offline session');
  }

  public onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    this.listeners.push(callback);
    // Immediately call back with current user
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }
}

export class LocalStorageService implements IStorageService {
  public async loadTasks(uid: string): Promise<Task[]> {
    const data = localStorage.getItem('todo-tasks');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('[LOCAL STORAGE] Failed to parse local tasks, returning empty list', e);
      }
    }
    return [];
  }

  public async saveTasks(uid: string, tasks: Task[]): Promise<void> {
    localStorage.setItem('todo-tasks', JSON.stringify(tasks));
  }

  public async loadSettings(uid: string): Promise<UserSettings> {
    const data = localStorage.getItem('todo-settings');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('[LOCAL STORAGE] Failed to parse local settings', e);
      }
    }
    return {};
  }

  public async saveSettings(uid: string, settings: UserSettings): Promise<void> {
    localStorage.setItem('todo-settings', JSON.stringify(settings));
  }

  public async loadProfile(uid: string): Promise<UserProfile | null> {
    const saved = localStorage.getItem('todo-profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('[LOCAL STORAGE] Failed to parse local profile', e);
      }
    }
    return { ...DEFAULT_PROFILE };
  }

  public async saveProfile(uid: string, profile: UserProfile): Promise<void> {
    localStorage.setItem('todo-profile', JSON.stringify(profile));
  }

  public async uploadProfileImage(uid: string, blob: Blob, onProgress: (progress: number) => void): Promise<string> {
    console.log('[LOCAL STORAGE] Starting offline avatar upload simulation...');
    
    // Simulate real upload progress updates as requested
    for (let i = 1; i <= 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 60));
      onProgress(i * 10);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        console.log('[LOCAL STORAGE] Offline avatar converted to local data URL.');
        resolve(base64data);
      };
      reader.onerror = () => {
        reject(new Error('Failed to convert image blob to data URL'));
      };
      reader.readAsDataURL(blob);
    });
  }
}
