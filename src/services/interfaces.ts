import { Task } from '../types';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // Extended fields for profile management
  name?: string;
  dob?: string;
  gender?: string;
  country?: string;
  timezone?: string;
  theme?: string;
  firstDayOfWeek?: string;
  enableDailyDigest?: boolean;
  compactMode?: boolean;
  updatedAt?: string;
  notificationPrefs?: {
    minutesBefore30: boolean;
    minutesBefore15: boolean;
    minutesBefore5: boolean;
    atDeadline: boolean;
  };
}

export interface UserSettings {
  theme?: string;
  calendarPreferences?: any;
  [key: string]: any;
}

export interface IAuthService {
  signInWithGoogle(): Promise<UserProfile>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void;
  getCurrentUser(): UserProfile | null;
}

export interface IStorageService {
  loadTasks(uid: string): Promise<Task[]>;
  saveTasks(uid: string, tasks: Task[]): Promise<void>;
  
  loadSettings(uid: string): Promise<UserSettings>;
  saveSettings(uid: string, settings: UserSettings): Promise<void>;

  loadProfile(uid: string): Promise<UserProfile | null>;
  saveProfile(uid: string, profile: UserProfile): Promise<void>;
  uploadProfileImage(uid: string, blob: Blob, onProgress: (progress: number) => void): Promise<string>;
}
