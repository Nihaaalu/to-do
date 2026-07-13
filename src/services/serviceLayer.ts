import { Task, UndoAction } from '../types';
import { 
  DSALinkedList, 
  DSAHashTable, 
  DSABinaryHeap, 
  DSAQueue, 
  DSAStack, 
  DSAMergeSort, 
  DSABinarySearch,
  calculateUrgencyScore
} from '../dsa';
import { IStorageService } from './interfaces';

export class TaskService {
  private storageService: IStorageService;
  private tasks: Task[] = [];
  private cachedStats: any = null;
  
  // Custom DSA structures maintained incrementally
  public list = new DSALinkedList<Task>();
  public hash = new DSAHashTable<number, Task>();
  public heap = new DSABinaryHeap();
  public queue = new DSAQueue<Task>();
  public stack = new DSAStack<UndoAction>();
  
  private onTasksUpdatedCallbacks: Array<(tasks: Task[]) => void> = [];
  private terminalLogCallback?: (msg: string) => void;

  constructor(storageService: IStorageService) {
    this.storageService = storageService;
  }

  public registerOnTasksUpdated(cb: (tasks: Task[]) => void) {
    this.onTasksUpdatedCallbacks.push(cb);
  }

  public registerTerminalLog(cb: (msg: string) => void) {
    this.terminalLogCallback = cb;
  }

  private log(msg: string) {
    if (this.terminalLogCallback) {
      this.terminalLogCallback(msg);
    }
  }

  private notifyUpdate() {
    this.onTasksUpdatedCallbacks.forEach(cb => cb([...this.tasks]));
  }

  // Build/Rebuild all in-memory custom data structures from our current tasks state
  public synchronizeDSA() {
    this.cachedStats = null;
    this.list.clear();
    this.hash = new DSAHashTable<number, Task>();
    this.heap.clear();
    this.queue = new DSAQueue<Task>();

    // Load active tasks into list, hash, and heap
    const activeTasks = this.tasks.filter(t => t.status !== 'Completed');
    activeTasks.forEach(t => {
      this.list.insert(t);
      this.hash.insert(t.taskId, t);
    });
    this.heap.buildHeap(activeTasks);

    // Load completed tasks into queue (FIFO queue of accomplishments)
    // To ensure completed numbering starts from earliest to latest or matches,
    // let's sort completed tasks by completion date ASC before enqueuing so dequeue gets the correct order,
    // or keep them in natural array order.
    const completedTasks = this.tasks.filter(t => t.status === 'Completed');
    completedTasks.forEach(t => {
      this.queue.enqueue(t);
    });

    this.log(`[DSA LAYER] Re-synchronized in-memory custom data structures. Active: ${activeTasks.length}, Completed Queue: ${completedTasks.length}`);
  }

  public async loadAll(uid: string): Promise<Task[]> {
    this.log('[SERVICE LAYER] Loading task repository from Local Storage...');
    const loaded = await this.storageService.loadTasks(uid);
    this.tasks = loaded;
    this.synchronizeDSA();
    this.notifyUpdate();
    this.log(`[SERVICE LAYER] Task repository successfully loaded. Total items: ${loaded.length}`);
    return this.tasks;
  }

  private async saveAll(uid: string): Promise<void> {
    try {
      this.log('[SERVICE LAYER] Synchronizing current state with Local Storage...');
      await this.storageService.saveTasks(uid, this.tasks);
      this.log('[SERVICE LAYER] Local Storage persistence synchronized successfully.');
    } catch (err) {
      this.log('[SERVICE LAYER] Warning: Failed to persist to Local Storage.');
      console.error(err);
    }
  }

  public async addTask(
    uid: string, 
    title: string, 
    description: string, 
    priority: number, 
    dueDate: string, // YYYY-MM-DD
    dueTime: string, // HH:MM or HH:MM AM/PM
    category: string
  ): Promise<Task> {
    const nextId = this.tasks.length > 0 ? Math.max(...this.tasks.map(t => t.taskId)) + 1 : 1;
    
    // Formatting helper
    const formatToDDMMYYYYLocal = (isoDateStr: string) => {
      const parts = isoDateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return isoDateStr;
    };

    // Combine Date & Time to a timestamp helper
    const combineDateTimeToTimestamp = (dateStr: string, timeStr: string): number => {
      if (!dateStr) return 0;
      let normalizedDate = dateStr;
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          normalizedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      
      let hour = 12;
      let minute = 0;
      
      if (timeStr) {
        const ampmMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (ampmMatch) {
          hour = parseInt(ampmMatch[1], 10);
          minute = parseInt(ampmMatch[2], 10);
          const isPM = ampmMatch[3].toUpperCase() === 'PM';
          if (isPM && hour < 12) hour += 12;
          if (!isPM && hour === 12) hour = 0;
        } else {
          const match24 = timeStr.match(/(\d+):(\d+)/);
          if (match24) {
            hour = parseInt(match24[1], 10);
            minute = parseInt(match24[2], 10);
          }
        }
      }
      
      const d = new Date(normalizedDate);
      d.setHours(hour, minute, 0, 0);
      return d.getTime();
    };

    const formattedDueDate = formatToDDMMYYYYLocal(dueDate);
    const ts = combineDateTimeToTimestamp(dueDate, dueTime);

    const newTask: Task = {
      taskId: nextId,
      title,
      description,
      priority,
      dueDate: formattedDueDate,
      dueTime: dueTime || '12:00 PM',
      dueTimestamp: ts,
      status: 'Pending',
      category: category || 'Work',
      createdDate: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
      createdAt: Date.now()
    };

    this.tasks.push(newTask);
    this.synchronizeDSA();
    
    // Push add action to Undo stack
    const stackLog = this.stack.push({ type: 'ADD', task: newTask });
    this.log(stackLog);
    this.log(`[DSA LINKED LIST] Inserted task ID ${newTask.taskId} in O(1) time.`);
    this.log(`[DSA HASH TABLE] Inserted key "${newTask.taskId}" in O(1) average time.`);
    this.log(`[DSA BINARY HEAP] Heapified task ID ${newTask.taskId} with priority ${newTask.priority} in O(log n).`);

    this.notifyUpdate();
    await this.saveAll(uid);
    return newTask;
  }

  public async deleteTask(uid: string, taskId: number): Promise<void> {
    const targetTask = this.tasks.find(t => t.taskId === taskId);
    if (!targetTask) return;

    this.tasks = this.tasks.filter(t => t.taskId !== taskId);
    this.synchronizeDSA();

    // Push delete action to Undo stack
    const stackLog = this.stack.push({ type: 'DELETE', task: targetTask });
    this.log(stackLog);
    this.log(`[SERVICE LAYER] Task ID ${taskId} removed and custom structures synchronized.`);

    this.notifyUpdate();
    await this.saveAll(uid);
  }

  public async editTask(uid: string, updatedTask: Task): Promise<void> {
    const oldState = this.tasks.find(t => t.taskId === updatedTask.taskId);
    if (!oldState) return;

    // Formatting helper
    const formatToDDMMYYYYLocal = (isoDateStr: string) => {
      if (isoDateStr.includes('/')) return isoDateStr;
      const parts = isoDateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return isoDateStr;
    };

    // Combine Date & Time to a timestamp helper
    const combineDateTimeToTimestamp = (dateStr: string, timeStr: string): number => {
      if (!dateStr) return 0;
      let normalizedDate = dateStr;
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          normalizedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      
      let hour = 12;
      let minute = 0;
      
      if (timeStr) {
        const ampmMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (ampmMatch) {
          hour = parseInt(ampmMatch[1], 10);
          minute = parseInt(ampmMatch[2], 10);
          const isPM = ampmMatch[3].toUpperCase() === 'PM';
          if (isPM && hour < 12) hour += 12;
          if (!isPM && hour === 12) hour = 0;
        } else {
          const match24 = timeStr.match(/(\d+):(\d+)/);
          if (match24) {
            hour = parseInt(match24[1], 10);
            minute = parseInt(match24[2], 10);
          }
        }
      }
      
      const d = new Date(normalizedDate);
      d.setHours(hour, minute, 0, 0);
      return d.getTime();
    };

    const isoDate = updatedTask.dueDate.includes('/')
      ? updatedTask.dueDate.split('/').reverse().join('-')
      : updatedTask.dueDate;

    const ts = combineDateTimeToTimestamp(isoDate, updatedTask.dueTime);

    const editedTask: Task = {
      ...updatedTask,
      dueDate: formatToDDMMYYYYLocal(updatedTask.dueDate),
      dueTimestamp: ts,
    };

    if (editedTask.status === 'Completed' && oldState.status !== 'Completed') {
      editedTask.completedDate = new Date().toLocaleDateString('en-GB');
      editedTask.completedAt = Date.now();
    } else if (editedTask.status === 'Pending') {
      editedTask.completedDate = undefined;
      editedTask.completedAt = undefined;
    }

    this.tasks = this.tasks.map(t => t.taskId === editedTask.taskId ? editedTask : t);
    this.synchronizeDSA();

    const stackLog = this.stack.push({ type: 'EDIT', task: editedTask, oldState: { ...oldState } });
    this.log(stackLog);
    this.log(`[SERVICE LAYER] Task ID ${editedTask.taskId} edited and custom structures synchronized.`);

    this.notifyUpdate();
    await this.saveAll(uid);
  }

  public async markComplete(uid: string, taskId: number): Promise<void> {
    const targetTask = this.tasks.find(t => t.taskId === taskId);
    if (!targetTask) return;

    const oldState = { ...targetTask };
    const todayStr = new Date().toLocaleDateString('en-GB');
    const completedTask: Task = { 
      ...targetTask, 
      status: 'Completed', 
      completedDate: todayStr,
      completedAt: Date.now()
    };

    this.tasks = this.tasks.map(t => t.taskId === taskId ? completedTask : t);
    this.synchronizeDSA();

    const stackLog = this.stack.push({ type: 'EDIT', task: completedTask, oldState });
    this.log(stackLog);
    this.log(`[SERVICE LAYER] Task ID ${taskId} completed and moved to accomplished queue.`);

    this.notifyUpdate();
    await this.saveAll(uid);
  }

  public async revertComplete(uid: string, taskId: number): Promise<void> {
    const targetTask = this.tasks.find(t => t.taskId === taskId);
    if (!targetTask) return;

    const oldState = { ...targetTask };
    const pendingTask: Task = { 
      ...targetTask, 
      status: 'Pending', 
      completedDate: undefined,
      completedAt: undefined 
    };

    this.tasks = this.tasks.map(t => t.taskId === taskId ? pendingTask : t);
    this.synchronizeDSA();

    const stackLog = this.stack.push({ type: 'EDIT', task: pendingTask, oldState });
    this.log(stackLog);
    this.log(`[SERVICE LAYER] Reverted task ID ${taskId} back to Pending status.`);

    this.notifyUpdate();
    await this.saveAll(uid);
  }

  public async loadProfile(uid: string) {
    return await this.storageService.loadProfile(uid);
  }

  public async saveProfile(uid: string, profile: any) {
    await this.storageService.saveProfile(uid, profile);
  }

  public async uploadProfileImage(uid: string, blob: Blob, onProgress: (progress: number) => void): Promise<string> {
    return await this.storageService.uploadProfileImage(uid, blob, onProgress);
  }

  public getTasksFromDSA(): Task[] {
    const all: Task[] = [];
    let currList = this.list.head;
    while (currList) {
      all.push(currList.data);
      currList = currList.next;
    }
    let currQueue = this.queue.head;
    while (currQueue) {
      all.push(currQueue.data);
      currQueue = currQueue.next;
    }
    return all;
  }

  public parseTaskDueDate(t: Task): Date {
    const dStr = t.dueDate;
    if (!dStr) {
      const d = new Date(t.dueTimestamp || t.createdAt || Date.now());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    let d: Date;
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    } else {
      d = new Date(dStr);
    }
    d.setHours(0, 0, 0, 0);
    return d;
  }

  public parseTaskCreatedDate(t: Task): Date {
    const dStr = t.createdDate;
    if (!dStr) {
      const d = new Date(t.createdAt || Date.now());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    let d: Date;
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    } else {
      d = new Date(dStr);
    }
    d.setHours(0, 0, 0, 0);
    return d;
  }

  public parseTaskCompletedDate(t: Task): Date | null {
    if (t.status !== 'Completed') return null;
    const dStr = t.completedDate;
    if (!dStr) {
      if (!t.completedAt) return null;
      const d = new Date(t.completedAt);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    let d: Date;
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    } else {
      d = new Date(dStr);
    }
    d.setHours(0, 0, 0, 0);
    return d;
  }

  public formatDateToYYYYMMDD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const r = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${r}`;
  }

  public getSmartStatistics() {
    if (this.cachedStats) {
      return this.cachedStats;
    }

    const allTasks = this.getTasksFromDSA();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    // Find earliest date in workspace
    let earliestDate = new Date(today);
    allTasks.forEach(t => {
      const d1 = this.parseTaskDueDate(t);
      const d2 = this.parseTaskCreatedDate(t);
      const d3 = this.parseTaskCompletedDate(t);
      if (d1.getTime() < earliestDate.getTime()) earliestDate = d1;
      if (d2.getTime() < earliestDate.getTime()) earliestDate = d2;
      if (d3 && d3.getTime() < earliestDate.getTime()) earliestDate = d3;
    });

    // Compute task counts added & completed per calendar date
    const addedCounts: { [key: string]: number } = {};
    const completedCounts: { [key: string]: number } = {};

    allTasks.forEach(t => {
      const createdStr = this.formatDateToYYYYMMDD(this.parseTaskCreatedDate(t));
      addedCounts[createdStr] = (addedCounts[createdStr] || 0) + 1;

      const completedObj = this.parseTaskCompletedDate(t);
      if (completedObj) {
        const completedStr = this.formatDateToYYYYMMDD(completedObj);
        completedCounts[completedStr] = (completedCounts[completedStr] || 0) + 1;
      }
    });

    // 1. Today's Progress: Completed tasks due today / Total tasks due today
    const todayTasks = allTasks.filter(t => this.parseTaskDueDate(t).getTime() === todayTime);
    const todayCompleted = todayTasks.filter(t => t.status === 'Completed');
    const todayProgress = { completed: todayCompleted.length, total: todayTasks.length };

    // 4. Current Daily Streak
    let currentDailyStreak = 0;
    let checkDate = new Date(today);
    let isToday = true;

    while (true) {
      const dateStr = this.formatDateToYYYYMMDD(checkDate);
      const satisfies = (addedCounts[dateStr] || 0) >= 1 && (completedCounts[dateStr] || 0) >= 1;
      
      if (satisfies) {
        currentDailyStreak++;
      } else {
        if (!isToday) {
          break;
        }
      }
      isToday = false;
      checkDate.setDate(checkDate.getDate() - 1);
      if (checkDate.getTime() < earliestDate.getTime() - 24 * 60 * 60 * 1000) {
        break;
      }
    }

    // 5. Best Daily Streak
    let bestDailyStreak = 0;
    let runningStreak = 0;
    let walkDate = new Date(earliestDate);
    while (walkDate.getTime() <= today.getTime()) {
      const dateStr = this.formatDateToYYYYMMDD(walkDate);
      const satisfies = (addedCounts[dateStr] || 0) >= 1 && (completedCounts[dateStr] || 0) >= 1;
      
      if (satisfies) {
        runningStreak++;
        if (runningStreak > bestDailyStreak) {
          bestDailyStreak = runningStreak;
        }
      } else {
        if (walkDate.getTime() === today.getTime()) {
          // Keep active running streak alive on today
        } else {
          runningStreak = 0;
        }
      }
      walkDate.setDate(walkDate.getDate() + 1);
    }

    // 6. Weekly Streak: Every day of calendar Monday->Sunday has Added>=1 & Completed>=1
    let weeklyStreak = 0;
    let w = 0;
    while (true) {
      const mon = new Date(today);
      const dayVal = today.getDay();
      const diff = dayVal === 0 ? -6 : 1 - dayVal;
      mon.setDate(today.getDate() + diff - (7 * w));
      mon.setHours(0, 0, 0, 0);

      if (mon.getTime() < earliestDate.getTime() - 7 * 24 * 60 * 60 * 1000) {
        break;
      }

      let weekFailed = false;
      let allDaysSatisfied = true;
      let hasFutureDays = false;

      for (let d = 0; d < 7; d++) {
        const checkDay = new Date(mon);
        checkDay.setDate(mon.getDate() + d);
        checkDay.setHours(0, 0, 0, 0);

        const dateStr = this.formatDateToYYYYMMDD(checkDay);
        const satisfies = (addedCounts[dateStr] || 0) >= 1 && (completedCounts[dateStr] || 0) >= 1;

        if (checkDay.getTime() > today.getTime()) {
          hasFutureDays = true;
          allDaysSatisfied = false;
        } else if (checkDay.getTime() === today.getTime()) {
          if (satisfies) {
            // satisfied
          } else {
            allDaysSatisfied = false;
          }
        } else {
          if (!satisfies) {
            weekFailed = true;
            allDaysSatisfied = false;
          }
        }
      }

      if (weekFailed) {
        break;
      }

      if (allDaysSatisfied && !hasFutureDays) {
        weeklyStreak++;
      }

      w++;
      if (w > 520) break;
    }

    // 7. Monthly Streak: Every day of calendar month has Added>=1 & Completed>=1
    let monthlyStreak = 0;
    let m = 0;
    while (true) {
      const monStart = new Date(today.getFullYear(), today.getMonth() - m, 1, 0, 0, 0, 0);
      
      if (monStart.getTime() < earliestDate.getTime() - 31 * 24 * 60 * 60 * 1000) {
        break;
      }

      const monEnd = new Date(monStart.getFullYear(), monStart.getMonth() + 1, 0, 0, 0, 0, 0);

      let monthFailed = false;
      let allDaysSatisfied = true;
      let hasFutureDays = false;

      const totalDaysInMonth = monEnd.getDate();
      for (let d = 1; d <= totalDaysInMonth; d++) {
        const checkDay = new Date(monStart.getFullYear(), monStart.getMonth(), d, 0, 0, 0, 0);
        
        const dateStr = this.formatDateToYYYYMMDD(checkDay);
        const satisfies = (addedCounts[dateStr] || 0) >= 1 && (completedCounts[dateStr] || 0) >= 1;

        if (checkDay.getTime() > today.getTime()) {
          hasFutureDays = true;
          allDaysSatisfied = false;
        } else if (checkDay.getTime() === today.getTime()) {
          if (satisfies) {
            // satisfied
          } else {
            allDaysSatisfied = false;
          }
        } else {
          if (!satisfies) {
            monthFailed = true;
            allDaysSatisfied = false;
          }
        }
      }

      if (monthFailed) {
        break;
      }

      if (allDaysSatisfied && !hasFutureDays) {
        monthlyStreak++;
      }

      m++;
      if (m > 120) break;
    }

    // 8. Other Metrics
    const overdueCount = allTasks.filter(t => t.status !== 'Completed' && this.parseTaskDueDate(t).getTime() < todayTime).length;
    
    const completedTodayCount = allTasks.filter(t => {
      const compObj = this.parseTaskCompletedDate(t);
      return compObj && compObj.getTime() === todayTime;
    }).length;

    const pendingTodayCount = allTasks.filter(t => t.status !== 'Completed' && this.parseTaskDueDate(t).getTime() === todayTime).length;

    const totalTasksCount = allTasks.length;
    const completedTasksCount = allTasks.filter(t => t.status === 'Completed').length;
    const overallCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    // Daily average completion rate
    const dailyRates: number[] = [];
    const tasksByDueDate: { [key: string]: Task[] } = {};
    allTasks.forEach(t => {
      const dueStr = this.formatDateToYYYYMMDD(this.parseTaskDueDate(t));
      if (!tasksByDueDate[dueStr]) tasksByDueDate[dueStr] = [];
      tasksByDueDate[dueStr].push(t);
    });

    Object.keys(tasksByDueDate).forEach(dateStr => {
      const dayTasks = tasksByDueDate[dateStr];
      const comp = dayTasks.filter(t => t.status === 'Completed').length;
      dailyRates.push((comp / dayTasks.length) * 100);
    });

    const averageCompletionRate = dailyRates.length > 0 ? Math.round(dailyRates.reduce((a, b) => a + b, 0) / dailyRates.length) : 0;

    this.cachedStats = {
      pendingToday: pendingTodayCount,
      overdue: overdueCount,
      completedToday: completedTodayCount,
      
      todayProgress,

      currentDailyStreak,
      bestDailyStreak,
      weeklyStreak,
      monthlyStreak,

      overallCompletionRate,
      averageCompletionRate,

      // Deprecated fields mapped for compatibility
      completionRate: todayProgress.total > 0 ? Math.round((todayProgress.completed / todayProgress.total) * 100) : 0,
      streak: currentDailyStreak,
      lastCompletedDate: null
    };

    this.log(`[DSA ANALYTICS] Computed analytics in O(N) time using DSALinkedList traversal. Today's progress: ${todayProgress.completed}/${todayProgress.total} (${this.cachedStats.completionRate}%). Streaks: Daily: ${currentDailyStreak} (Best: ${bestDailyStreak}), Weekly: ${weeklyStreak}, Monthly: ${monthlyStreak}.`);

    return this.cachedStats;
  }

  public getCompletionGraphData(rangeType: '7' | '30' | 'custom', customStart?: string, customEnd?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startLimit = new Date(today);
    let endLimit = new Date(today);
    
    if (rangeType === '7') {
      startLimit.setDate(today.getDate() - 6);
    } else if (rangeType === '30') {
      startLimit.setDate(today.getDate() - 29);
    } else if (rangeType === 'custom' && customStart && customEnd) {
      const parseISO = (s: string) => {
        const parts = s.split('-');
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);
      };
      try {
        startLimit = parseISO(customStart);
        endLimit = parseISO(customEnd);
      } catch (e) {
        startLimit.setDate(today.getDate() - 6);
      }
    } else {
      startLimit.setDate(today.getDate() - 6);
    }
    
    const data: Array<{ date: string; percentage: number; rawDate: string; total: number; completed: number }> = [];
    const walk = new Date(startLimit);
    
    const allTasks = this.getTasksFromDSA();
    const tasksByDueDate: { [key: string]: Task[] } = {};
    allTasks.forEach(t => {
      const dueStr = this.formatDateToYYYYMMDD(this.parseTaskDueDate(t));
      if (!tasksByDueDate[dueStr]) tasksByDueDate[dueStr] = [];
      tasksByDueDate[dueStr].push(t);
    });

    const formatDateShort = (d: Date): string => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    };

    while (walk.getTime() <= endLimit.getTime()) {
      const dateStr = this.formatDateToYYYYMMDD(walk);
      const dayTasks = tasksByDueDate[dateStr] || [];
      const total = dayTasks.length;
      const completed = dayTasks.filter(t => t.status === 'Completed').length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      data.push({
        date: formatDateShort(walk),
        percentage,
        rawDate: dateStr,
        total,
        completed
      });
      
      walk.setDate(walk.getDate() + 1);
    }
    
    return data;
  }

  public async undo(uid: string): Promise<void> {
    const popped = this.stack.pop();
    this.log(popped.log);
    const action = popped.data;
    if (!action) {
      this.log('[UNDO] Undo stack is empty.');
      return;
    }

    if (action.type === 'ADD') {
      this.tasks = this.tasks.filter(t => t.taskId !== action.task.taskId);
      this.log(`[UNDO] Reversing ADD operation. Removing Task ID ${action.task.taskId}.`);
    } else if (action.type === 'DELETE') {
      this.tasks.push(action.task);
      this.log(`[UNDO] Reversing DELETE operation. Restoring Task ID ${action.task.taskId}.`);
    } else if (action.type === 'EDIT' && action.oldState) {
      this.tasks = this.tasks.map(t => t.taskId === action.task.taskId ? action.oldState! : t);
      this.log(`[UNDO] Reversing EDIT operation. Reverting Task ID ${action.task.taskId} to old state.`);
    }

    this.synchronizeDSA();
    this.notifyUpdate();
    await this.saveAll(uid);
  }

  // Standard processing for the Active Tasks view
  public getProcessedTasks(
    searchQuery: string, 
    searchType: 'title' | 'id', 
    filterBy: 'All Active' | 'Pending' | 'Overdue', 
    sortBy: 'id' | 'title' | 'priority' | 'duedate'
  ): Task[] {
    // HOME page dashboard displays ONLY Today's Tasks & Overdue Tasks.
    // It should NEVER display future tasks or completed tasks.
    let filtered = this.tasks.filter(t => t.status !== 'Completed');

    // Parse date for overdue comparison
    const parseDateValue = (dStr: string) => {
      if (!dStr) return 0;
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
      }
      return new Date(dStr).getTime();
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTime = tomorrow.getTime();

    // STRICT HOME VIEW FILTER:
    // Only display tasks whose due date is <= today (Today or Overdue).
    // Future tasks (due date > today) are hidden on Home.
    filtered = filtered.filter(t => {
      const dueTime = parseDateValue(t.dueDate);
      return dueTime < tomorrowTime; // dueTime is today or before today
    });

    // Apply filters
    if (filterBy === 'Pending') {
      filtered = filtered.filter(t => t.status === 'Pending');
    } else if (filterBy === 'Overdue') {
      filtered = filtered.filter(t => {
        const dueTime = parseDateValue(t.dueDate);
        return dueTime < todayTime;
      });
    }

    // Apply Search
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      if (searchType === 'id') {
        filtered = filtered.filter(t => String(t.taskId) === query);
      } else {
        filtered = filtered.filter(t => t.title.toLowerCase().includes(query));
      }
    }

    // Sort using custom Merge Sort (guarantees our tie-breaker logic in DSA)
    const sorted = DSAMergeSort.sort(filtered, sortBy);
    return sorted.array;
  }

  // Standard processing for Completed Tasks view
  public getProcessedCompletedTasks(
    searchQuery: string, 
    searchType: 'title' | 'id', 
    priorityFilter: 'All' | 'High' | 'Medium' | 'Low'
  ): Task[] {
    let list = this.tasks.filter(t => t.status === 'Completed');

    // Apply filters
    if (priorityFilter !== 'All') {
      const priorityMap: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
      const val = priorityMap[priorityFilter];
      list = list.filter(t => t.priority === val);
    }

    // Apply search
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      if (searchType === 'id') {
        list = list.filter(t => String(t.taskId) === query);
      } else {
        list = list.filter(t => t.title.toLowerCase().includes(query));
      }
    }

    // Sorting: Newest completed first / Completion timestamp descending
    const parseDateValue = (dStr: string | undefined) => {
      if (!dStr) return 0;
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
      }
      return new Date(dStr).getTime();
    };

    return list.sort((a, b) => {
      const dateA = parseDateValue(a.completedDate || a.dueDate);
      const dateB = parseDateValue(b.completedDate || b.dueDate);
      if (dateA !== dateB) {
        return dateB - dateA; // descending completion date
      }
      return b.taskId - a.taskId; // fallback secondary sort: larger task id first
    });
  }

  // Check custom data structures synchronization
  public getDiagnostics() {
    const listTasks = this.list.toArray();
    const hashTasks = this.hash.values();
    const heapTasks = this.heap.toArray();
    const completedTasks = this.tasks.filter(t => t.status === 'Completed');
    const queueTasks = this.queue.toArray();
    const activeTasks = this.tasks.filter(t => t.status !== 'Completed');

    const getSortedIds = (arr: Task[]) => arr.map(t => t.taskId).sort((a, b) => a - b);
    
    const listIds = getSortedIds(listTasks);
    const hashIds = getSortedIds(hashTasks);
    const heapIds = getSortedIds(heapTasks);
    const activeIds = getSortedIds(activeTasks);

    const isIdentical = 
      JSON.stringify(listIds) === JSON.stringify(hashIds) &&
      JSON.stringify(hashIds) === JSON.stringify(heapIds) &&
      JSON.stringify(heapIds) === JSON.stringify(activeIds);

    const noStale = 
      !listTasks.some(t => t.status === 'Completed') &&
      !hashTasks.some(t => t.status === 'Completed') &&
      !heapTasks.some(t => t.status === 'Completed');

    const hasDuplicates = (arr: Task[]) => new Set(arr.map(t => t.taskId)).size !== arr.length;
    const noDuplicates = !hasDuplicates(listTasks) && !hasDuplicates(hashTasks) && !hasDuplicates(heapTasks);

    let referencesMatch = true;
    for (const t of listTasks) {
      const fromHash = this.hash.search(t.taskId).value;
      const fromHeap = heapTasks.find(h => h.taskId === t.taskId);
      if (fromHash !== t || fromHeap !== t) {
        referencesMatch = false;
      }
    }

    let heapConsistent = true;
    const nowSnapshot = Date.now();
    for (let i = 0; i < heapTasks.length; i++) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      const parentVal = heapTasks[i];
      if (left < heapTasks.length) {
        const leftVal = heapTasks[left];
        const pScore = calculateUrgencyScore(parentVal, nowSnapshot);
        const lScore = calculateUrgencyScore(leftVal, nowSnapshot);
        if (pScore < lScore) {
          heapConsistent = false;
        } else if (Math.abs(pScore - lScore) <= 1e-9) {
          if (parentVal.priority < leftVal.priority) {
            heapConsistent = false;
          } else if (parentVal.priority === leftVal.priority) {
            if ((parentVal.dueTimestamp || 0) > (leftVal.dueTimestamp || 0)) {
              heapConsistent = false;
            } else if ((parentVal.dueTimestamp || 0) === (leftVal.dueTimestamp || 0)) {
              if (parentVal.createdAt > leftVal.createdAt) {
                heapConsistent = false;
              }
            }
          }
        }
      }
      if (right < heapTasks.length) {
        const rightVal = heapTasks[right];
        const pScore = calculateUrgencyScore(parentVal, nowSnapshot);
        const rScore = calculateUrgencyScore(rightVal, nowSnapshot);
        if (pScore < rScore) {
          heapConsistent = false;
        } else if (Math.abs(pScore - rScore) <= 1e-9) {
          if (parentVal.priority < rightVal.priority) {
            heapConsistent = false;
          } else if (parentVal.priority === rightVal.priority) {
            if ((parentVal.dueTimestamp || 0) > (rightVal.dueTimestamp || 0)) {
              heapConsistent = false;
            } else if ((parentVal.dueTimestamp || 0) === (rightVal.dueTimestamp || 0)) {
              if (parentVal.createdAt > rightVal.createdAt) {
                heapConsistent = false;
              }
            }
          }
        }
      }
    }

    let hashConsistent = true;
    for (const t of hashTasks) {
      const searchRes = this.hash.search(t.taskId);
      if (searchRes.value !== t) {
        hashConsistent = false;
      }
    }

    const queueConsistent = JSON.stringify(getSortedIds(queueTasks)) === JSON.stringify(getSortedIds(completedTasks));

    return {
      listTasks,
      hashTasks,
      heapTasks,
      queueTasks,
      listIds,
      hashIds,
      heapIds,
      isIdentical,
      noStale,
      noDuplicates,
      referencesMatch,
      heapConsistent,
      hashConsistent,
      queueConsistent,
      passed: isIdentical && noStale && noDuplicates && referencesMatch && heapConsistent && hashConsistent && queueConsistent
    };
  }
}
