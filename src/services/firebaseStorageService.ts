import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { IStorageService, UserProfile, UserSettings } from './interfaces';
import { Task } from '../types';

function serializeTask(task: Task): Record<string, any> {
  const data: Record<string, any> = {
    taskId: Number(task.taskId),
    title: task.title || '',
    description: task.description || '',
    priority: Number(task.priority) || 1,
    dueDate: task.dueDate || '',
    dueTime: task.dueTime || '',
    dueTimestamp: Number(task.dueTimestamp) || 0,
    status: task.status || 'Pending',
    category: task.category || 'Work',
    createdDate: task.createdDate || '',
    createdAt: Number(task.createdAt) || Date.now()
  };
  if (task.completedDate) {
    data.completedDate = task.completedDate;
  }
  if (task.completedAt) {
    data.completedAt = Number(task.completedAt);
  }
  return data;
}

function deserializeTask(id: string, data: any): Task {
  return {
    taskId: Number(data.taskId || id),
    title: String(data.title || ''),
    description: String(data.description || ''),
    priority: Number(data.priority) || 1,
    dueDate: String(data.dueDate || ''),
    dueTime: String(data.dueTime || ''),
    dueTimestamp: Number(data.dueTimestamp) || 0,
    status: (data.status === 'Completed' ? 'Completed' : 'Pending') as 'Pending' | 'Completed',
    category: String(data.category || 'Work'),
    createdDate: String(data.createdDate || ''),
    createdAt: Number(data.createdAt) || Date.now(),
    completedDate: data.completedDate ? String(data.completedDate) : undefined,
    completedAt: data.completedAt ? Number(data.completedAt) : undefined
  };
}

export class FirebaseStorageService implements IStorageService {
  // Load tasks from Cloud Firestore (/users/{userId}/tasks and /users/{userId}/completedTasks)
  public async loadTasks(uid: string): Promise<Task[]> {
    try {
      const activeRef = collection(db, 'users', uid, 'tasks');
      const completedRef = collection(db, 'users', uid, 'completedTasks');

      const [activeSnap, completedSnap] = await Promise.all([
        getDocs(activeRef),
        getDocs(completedRef)
      ]);

      const tasks: Task[] = [];
      const seenIds = new Set<number>();

      activeSnap.forEach((docSnap) => {
        const task = deserializeTask(docSnap.id, docSnap.data());
        task.status = 'Pending';
        if (!seenIds.has(task.taskId)) {
          seenIds.add(task.taskId);
          tasks.push(task);
        }
      });

      completedSnap.forEach((docSnap) => {
        const task = deserializeTask(docSnap.id, docSnap.data());
        task.status = 'Completed';
        if (!seenIds.has(task.taskId)) {
          seenIds.add(task.taskId);
          tasks.push(task);
        }
      });

      return tasks;
    } catch (e) {
      console.error('[FIREBASE STORAGE] Error loading tasks from Firestore', e);
      throw e;
    }
  }

  // Real-time synchronization subscription across devices
  public subscribeToTasks(uid: string, onUpdate: (tasks: Task[]) => void, onError?: (err: any) => void): () => void {
    const activeRef = collection(db, 'users', uid, 'tasks');
    const completedRef = collection(db, 'users', uid, 'completedTasks');

    const activeMap = new Map<string, Task>();
    const completedMap = new Map<string, Task>();
    let isInitialActiveLoaded = false;
    let isInitialCompletedLoaded = false;

    const emitMerged = () => {
      const allTasks: Task[] = [];
      const seen = new Set<number>();

      activeMap.forEach(task => {
        if (!seen.has(task.taskId)) {
          seen.add(task.taskId);
          allTasks.push(task);
        }
      });

      completedMap.forEach(task => {
        if (!seen.has(task.taskId)) {
          seen.add(task.taskId);
          allTasks.push(task);
        }
      });

      onUpdate(allTasks);
    };

    const unsubActive = onSnapshot(activeRef, (snapshot) => {
      activeMap.clear();
      snapshot.forEach(docSnap => {
        const t = deserializeTask(docSnap.id, docSnap.data());
        t.status = 'Pending';
        activeMap.set(docSnap.id, t);
      });
      isInitialActiveLoaded = true;
      if (isInitialCompletedLoaded) {
        emitMerged();
      }
    }, (err) => {
      console.error('[FIREBASE STORAGE] Active tasks snapshot listener error', err);
      if (onError) onError(err);
    });

    const unsubCompleted = onSnapshot(completedRef, (snapshot) => {
      completedMap.clear();
      snapshot.forEach(docSnap => {
        const t = deserializeTask(docSnap.id, docSnap.data());
        t.status = 'Completed';
        completedMap.set(docSnap.id, t);
      });
      isInitialCompletedLoaded = true;
      if (isInitialActiveLoaded) {
        emitMerged();
      }
    }, (err) => {
      console.error('[FIREBASE STORAGE] Completed tasks snapshot listener error', err);
      if (onError) onError(err);
    });

    return () => {
      unsubActive();
      unsubCompleted();
    };
  }

  // Save a single task to Firestore (/users/{userId}/tasks/{taskId} or completedTasks/{taskId})
  public async saveTask(uid: string, task: Task): Promise<void> {
    const docId = String(task.taskId);
    const data = serializeTask(task);

    try {
      if (task.status === 'Completed') {
        const compRef = doc(db, 'users', uid, 'completedTasks', docId);
        const actRef = doc(db, 'users', uid, 'tasks', docId);
        await setDoc(compRef, data, { merge: true });
        await deleteDoc(actRef).catch(() => {});
      } else {
        const actRef = doc(db, 'users', uid, 'tasks', docId);
        const compRef = doc(db, 'users', uid, 'completedTasks', docId);
        await setDoc(actRef, data, { merge: true });
        await deleteDoc(compRef).catch(() => {});
      }
    } catch (e) {
      console.error(`[FIREBASE STORAGE] Error saving task ${task.taskId} to Firestore`, e);
      throw e;
    }
  }

  // Delete a task from Firestore
  public async deleteTask(uid: string, taskId: number): Promise<void> {
    const docId = String(taskId);
    try {
      const actRef = doc(db, 'users', uid, 'tasks', docId);
      const compRef = doc(db, 'users', uid, 'completedTasks', docId);
      await Promise.all([
        deleteDoc(actRef).catch(() => {}),
        deleteDoc(compRef).catch(() => {})
      ]);
    } catch (e) {
      console.error(`[FIREBASE STORAGE] Error deleting task ${taskId} from Firestore`, e);
      throw e;
    }
  }

  // Batch save multiple tasks
  public async saveTasks(uid: string, tasks: Task[]): Promise<void> {
    if (tasks.length === 0) return;
    try {
      const batch = writeBatch(db);
      for (const t of tasks) {
        const docId = String(t.taskId);
        const data = serializeTask(t);
        if (t.status === 'Completed') {
          const compRef = doc(db, 'users', uid, 'completedTasks', docId);
          batch.set(compRef, data, { merge: true });
        } else {
          const actRef = doc(db, 'users', uid, 'tasks', docId);
          batch.set(actRef, data, { merge: true });
        }
      }
      await batch.commit();
    } catch (e) {
      console.error('[FIREBASE STORAGE] Error batch saving tasks to Firestore', e);
      throw e;
    }
  }

  // Settings loaded from Cloud Firestore (/users/{userId}/settings/user_prefs)
  public async loadSettings(uid: string): Promise<UserSettings> {
    try {
      const docRef = doc(db, 'users', uid, 'settings', 'user_prefs');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserSettings;
      }
    } catch (e) {
      console.error('[FIREBASE STORAGE] Error loading settings from Firestore', e);
    }
    return {};
  }

  // Settings saved to Cloud Firestore (/users/{userId}/settings/user_prefs)
  public async saveSettings(uid: string, settings: UserSettings): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid, 'settings', 'user_prefs');
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error('[FIREBASE STORAGE] Error saving settings to Firestore', e);
      throw e;
    }
  }

  // Profile loaded directly from Cloud Firestore (/users/{userId}/profile/info and /users/{userId})
  public async loadProfile(uid: string): Promise<UserProfile | null> {
    try {
      // First check /users/{userId}/profile/info
      const profileInfoRef = doc(db, 'users', uid, 'profile', 'info');
      let docSnap = await getDoc(profileInfoRef);
      
      if (!docSnap.exists()) {
        // Fallback to root /users/{userId}
        const userRef = doc(db, 'users', uid);
        docSnap = await getDoc(userRef);
      }

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          uid: data.uid || uid,
          email: data.email || null,
          displayName: data.fullName || data.name || data.displayName || null,
          photoURL: data.photoURL || '',
          name: data.fullName || data.name || data.displayName || '',
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

  // Profile saved directly to Cloud Firestore (/users/{userId}/profile/info and /users/{userId})
  public async saveProfile(uid: string, profile: UserProfile): Promise<void> {
    try {
      const profileInfoRef = doc(db, 'users', uid, 'profile', 'info');
      const rootUserRef = doc(db, 'users', uid);

      const updateData: any = {
        uid,
        fullName: profile.name || profile.displayName || 'User',
        name: profile.name || profile.displayName || 'User',
        email: profile.email || '',
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

      await Promise.all([
        setDoc(profileInfoRef, updateData, { merge: true }),
        setDoc(rootUserRef, updateData, { merge: true })
      ]);
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
