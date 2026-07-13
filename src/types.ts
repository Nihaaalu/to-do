export interface Task {
  taskId: number;
  title: string;
  description: string;
  priority: number; // 1 = Low, 2 = Medium, 3 = High
  dueDate: string; // YYYY-MM-DD (preferred)
  dueTime: string; // HH:MM or HH:MM AM/PM
  dueTimestamp: number; // combined date and time as a timestamp
  status: 'Pending' | 'Completed';
  category: string;
  createdDate: string;
  createdAt: number; // timestamp of creation
  completedDate?: string;
  completedAt?: number; // timestamp of completion
}

export type UndoActionType = 'ADD' | 'DELETE' | 'EDIT';

export interface UndoAction {
  type: UndoActionType;
  task: Task;
  oldState?: Task;
}
