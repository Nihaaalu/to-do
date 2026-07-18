import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Plus, 
  Edit3, 
  Undo2, 
  Search, 
  SlidersHorizontal, 
  TrendingUp, 
  LogOut,
  Calendar,
  Layers,
  Sparkles,
  Award,
  Flame,
  BarChart2,
  CalendarDays,
  Home,
  User,
  Settings,
  BookOpen,
  Code,
  GraduationCap,
  Folder,
  ShoppingCart,
  Heart,
  Camera,
  Menu,
  X
} from 'lucide-react';

import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

import { Task, UndoAction } from './types';
import { LocalAuthService, LocalStorageService } from './services/localLayer';
import { FirebaseAuthService } from './services/firebaseAuthService';
import { FirebaseStorageService } from './services/firebaseStorageService';
import { TaskService } from './services/serviceLayer';
import { CalendarView } from './components/CalendarView';
import { UserProfile, UserSettings } from './services/interfaces';
import { countries } from './data/countries';
import { SearchableCountrySelector } from './components/SearchableCountrySelector';
import { SearchableTimezoneSelector } from './components/SearchableTimezoneSelector';
import { AuthScreen } from './components/AuthScreen';

// Helper to format iso date (YYYY-MM-DD) to DD/MM/YYYY
function formatToDDMMYYYY(isoDateStr: string) {
  if (!isoDateStr) return '';
  const parts = isoDateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDateStr;
}

// Helper to format due date short
function formatDueDateShort(dStr: string) {
  if (!dStr) return '';
  const parts = dStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${months[monthIndex]}`;
    }
  }
  return dStr;
}

// Category vector icon provider
function getCategoryIcon(category: string, className = "w-3 h-3 text-white/40 inline") {
  const norm = category ? category.toLowerCase().trim() : '';
  if (norm.includes('study') || norm.includes('book')) return <BookOpen className={className} />;
  if (norm.includes('coding') || norm.includes('code') || norm.includes('program')) return <Code className={className} />;
  if (norm.includes('education') || norm.includes('school') || norm.includes('course')) return <GraduationCap className={className} />;
  if (norm.includes('personal') || norm.includes('home') || norm.includes('buy')) return <Home className={className} />;
  if (norm.includes('shopping') || norm.includes('cart') || norm.includes('shop')) return <ShoppingCart className={className} />;
  if (norm.includes('health') || norm.includes('heart') || norm.includes('med')) return <Heart className={className} />;
  return <Folder className={className} />;
}

// Time formatting helpers
function formatTo12Hour(timeStr: string): string {
  if (!timeStr) return '';
  const match = timeStr.match(/^(\d+):(\d+)(?::\d+)?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  }
  return timeStr;
}

function formatTo24Hour(time12: string): string {
  if (!time12) return '12:00';
  const match = time12.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const isPM = match[3].toUpperCase() === 'PM';
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  return time12;
}

// Personalized welcome greeting generator
function getDynamicGreeting(profile: UserProfile | null, currentUser: any, tasks: Task[]): { greeting: string; subtitle: string } {
  const now = new Date();
  const hours = now.getHours();
  let timeStr = 'Evening';
  if (hours < 12) {
    timeStr = 'Morning';
  } else if (hours < 18) {
    timeStr = 'Afternoon';
  }

  let rawName = profile?.name || profile?.displayName || currentUser?.displayName || '';
  if (!rawName && currentUser?.email) {
    rawName = currentUser.email.split('@')[0];
  }
  
  let name = 'Nihal';
  if (rawName) {
    name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  }
  const greeting = `Good ${timeStr}, ${name}.`;

  // Calculate the subtitle contextual sentence:
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const parseDateVal = (dStr: string) => {
    if (!dStr) return 0;
    const parts = dStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
    }
    return new Date(dStr).getTime();
  };

  const todayTasks = tasks.filter(t => {
    const taskTime = parseDateVal(t.dueDate);
    return taskTime >= startOfToday.getTime() && taskTime <= endOfToday.getTime();
  });
  
  const pendingToday = todayTasks.filter(t => t.status === 'Pending');
  const highPriorityPendingToday = pendingToday.filter(t => t.priority === 3);

  let subtitle = '';
  if (todayTasks.length === 0 || pendingToday.length === 0) {
    subtitle = "Everything is complete for today.";
  } else if (highPriorityPendingToday.length > 0) {
    subtitle = `${highPriorityPendingToday.length} high-priority task${highPriorityPendingToday.length > 1 ? 's' : ''} need${highPriorityPendingToday.length === 1 ? 's' : ''} attention.`;
  } else {
    subtitle = `You have ${pendingToday.length} task${pendingToday.length > 1 ? 's' : ''} scheduled today.`;
  }

  return { greeting, subtitle };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

export default function App() {
  // --- FIREBASE SERVICES ---
  const authService = useRef<FirebaseAuthService | null>(null);
  const storageService = useRef<FirebaseStorageService | null>(null);
  const taskService = useRef<TaskService | null>(null);

  if (!authService.current) {
    authService.current = new FirebaseAuthService();
    storageService.current = new FirebaseStorageService();
    taskService.current = new TaskService(storageService.current);
  }

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // UI Local States
  const [swingTab, setSwingTab] = useState<'home' | 'completed' | 'insights' | 'profile' | 'settings'>('home');
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error'; showUndo?: boolean }[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userProfileData, setUserProfileData] = useState<UserProfile | null>(null);

  // Sorting & Filtering
  const [sortBy, setSortBy] = useState<'id' | 'title' | 'priority' | 'duedate'>('priority');
  const [filterBy, setFilterBy] = useState<'All Active' | 'Pending' | 'Overdue'>('All Active');
  const [homePriorityFilter, setHomePriorityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [homeCategoryFilter, setHomeCategoryFilter] = useState<'All' | 'Work' | 'Personal' | 'Shopping' | 'Health' | 'Education' | 'Others'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'title' | 'id'>('title');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Calendar selected filter
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Analytics Graph states
  const [graphRange, setGraphRange] = useState<'7' | '30' | 'custom'>('7');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Completed Search & Filter
  const [completedSearchQuery, setCompletedSearchQuery] = useState('');
  const [completedSearchType, setCompletedSearchType] = useState<'title' | 'id'>('title');
  const [completedPriorityFilter, setCompletedPriorityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Task | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Add form fields
  const [addTitle, setAddTitle] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addPriority, setAddPriority] = useState<number>(2);
  const [addCategory, setAddCategory] = useState('Work');
  const [addDueDate, setAddDueDate] = useState('');
  const [addDueTime, setAddDueTime] = useState('12:00 PM');

  // Profile picture upload and utility states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'ME';
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const getDetectedCountryName = () => {
    try {
      const locale = navigator.language || 'en-IN';
      const parts = locale.split('-');
      const countryCode = parts.length > 1 ? parts[1].toUpperCase() : '';
      if (countryCode) {
        const match = countries.find(c => c.code === countryCode);
        if (match) return match.name;
      }
    } catch (e) {
      // ignore
    }
    return 'India';
  };

  // Micro-interaction stages
  const [completionStages, setCompletionStages] = useState<Record<number, 'checked' | 'strikethrough' | 'fade' | 'collapse'>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success', showUndo = false) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, showUndo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, showUndo ? 5000 : 3000);
  };

  const addTerminalLog = (msg: string) => {
    setTerminalLogs(prev => [...prev, msg].slice(-80));
  };

  // Monitor auth state changes / load local data
  useEffect(() => {
    addTerminalLog('[SYSTEM] Initializing Firebase Auth and Storage engine...');
    
    // Setup logging hooks
    taskService.current!.registerTerminalLog(addTerminalLog);
    taskService.current!.registerOnTasksUpdated((updatedTasks) => {
      setTasks(updatedTasks);
    });

    const unsubscribe = authService.current!.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setIsAuthChecking(false);
      if (user) {
        addTerminalLog('[SYSTEM] Secure cloud workspace active.');
        loadUserData(user.uid);
      } else {
        addTerminalLog('[SYSTEM] Secure workspace signed out.');
      }
    });

    return () => unsubscribe();
  }, []);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      setIsLoaded(false);
      await taskService.current!.loadAll(uid);
      const prof = await taskService.current!.loadProfile(uid);
      if (prof) {
        setUserProfileData(prof);
      } else {
        const initialProf: UserProfile = {
          uid,
          email: currentUser?.email || 'user@example.com',
          displayName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
          photoURL: '',
          name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
          dob: '',
          gender: 'Unspecified',
          country: getDetectedCountryName(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          theme: 'dark',
          notificationPrefs: {
            minutesBefore30: true,
            minutesBefore15: true,
            minutesBefore5: true,
            atDeadline: true
          }
        };
        await taskService.current!.saveProfile(uid, initialProf);
        setUserProfileData(initialProf);
      }
      setIsLoaded(true);
    } catch (error) {
      addTerminalLog('[ERROR] Failed to load local data.');
      addToast('Data load failed', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      addTerminalLog('[SYSTEM] Logging out of secure session...');
      await authService.current!.signOut();
      setCurrentUser(null);
      setTasks([]);
      setUserProfileData(null);
      setSwingTab('home');
      addTerminalLog('[SYSTEM] Successfully logged out.');
      addToast('Successfully signed out', 'success');
    } catch (err) {
      console.error(err);
      addTerminalLog('[SYSTEM] Log out failed.');
      addToast('Failed to sign out', 'error');
    }
  };

  // Add Task Coordinator
  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim() || !currentUser) return;

    try {
      const created = await taskService.current!.addTask(
        currentUser.uid,
        addTitle,
        addDesc,
        addPriority,
        addDueDate || new Date().toISOString().split('T')[0],
        addDueTime || '12:00 PM',
        addCategory
      );

      addToast(`Task created`, 'success');
      
      // Reset form fields
      setAddTitle('');
      setAddDesc('');
      setAddPriority(2);
      setAddCategory('Work');
      setAddDueDate('');
      setAddDueTime('12:00 PM');
      setShowAddModal(false);
    } catch (error) {
      addToast('Failed to create task', 'error');
    }
  };

  // Trigger editing submission
  const handleEditTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal || !currentUser) return;

    try {
      await taskService.current!.editTask(currentUser.uid, showEditModal);
      addToast('Task updated', 'success', true);
      setShowEditModal(null);
    } catch (error) {
      addToast('Failed to update task', 'error');
    }
  };

  // Interactive smooth completion sequence
  const triggerCompleteTask = (taskId: number) => {
    if (completionStages[taskId]) return;
    
    setCompletionStages(prev => ({ ...prev, [taskId]: 'checked' }));
    
    setTimeout(() => {
      setCompletionStages(prev => ({ ...prev, [taskId]: 'strikethrough' }));
    }, 200);
    
    setTimeout(() => {
      setCompletionStages(prev => ({ ...prev, [taskId]: 'fade' }));
    }, 450);
    
    setTimeout(() => {
      setCompletionStages(prev => ({ ...prev, [taskId]: 'collapse' }));
    }, 650);
    
    setTimeout(() => {
      if (currentUser) {
        taskService.current!.markComplete(currentUser.uid, taskId);
      }
      setCompletionStages(prev => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      addToast('Task completed', 'success', true);
    }, 850);
  };

  const triggerDeleteTask = async (taskId: number) => {
    if (!currentUser) return;
    try {
      await taskService.current!.deleteTask(currentUser.uid, taskId);
      addToast('Task deleted', 'info', true);
    } catch (error) {
      addToast('Delete failed', 'error');
    }
  };

  const triggerRevertComplete = async (taskId: number) => {
    if (!currentUser) return;
    try {
      await taskService.current!.revertComplete(currentUser.uid, taskId);
      addToast('Restored task to Pending queue', 'success');
    } catch (error) {
      addToast('Restoration failed', 'error');
    }
  };

  const handleUndo = async () => {
    if (!currentUser) return;
    try {
      await taskService.current!.undo(currentUser.uid);
      addToast('Action Undone', 'info');
    } catch (error) {
      addToast('Undo failed', 'error');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('File too large (exceeds 5MB limit)', 'error');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Unsupported image type. Only JPG, PNG, and WEBP are supported.', 'error');
      return;
    }

    const backupPhotoURL = userProfileData?.photoURL;

    try {
      setUploadProgress(0);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const localPreview = event.target?.result as string;
        
        // 1. Preview immediately
        setUserProfileData(prev => prev ? { ...prev, photoURL: localPreview } : null);

        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const size = Math.min(img.width, img.height);
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            addToast('Failed to process image canvas context', 'error');
            setUserProfileData(prev => prev ? { ...prev, photoURL: backupPhotoURL || null } : null);
            setUploadProgress(null);
            return;
          }

          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 512, 512);

          // 8. Image Optimization: WebP, compress to under 300KB (0.8 quality is perfect)
          canvas.toBlob(async (blob) => {
            if (!blob) {
              addToast('Compression failed', 'error');
              setUserProfileData(prev => prev ? { ...prev, photoURL: backupPhotoURL || null } : null);
              setUploadProgress(null);
              return;
            }

            try {
              // Start upload automatically
              const downloadURL = await taskService.current!.uploadProfileImage(
                currentUser.uid,
                blob,
                (prog) => setUploadProgress(prog)
              );

              // Update Firestore with photoURL and updatedAt
              const updatedProfile = {
                ...userProfileData,
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: downloadURL,
                updatedAt: new Date().toISOString()
              };

              await taskService.current!.saveProfile(currentUser.uid, updatedProfile);
              
              // Refresh state on success
              setUserProfileData(updatedProfile);
              console.log('Firestore updated');
              
              addToast('✓ Profile updated successfully', 'success');

            } catch (uploadErr: any) {
              console.error('[AVATAR UPLOAD ERROR]', uploadErr);
              // Revert preview on failure
              setUserProfileData(prev => prev ? { ...prev, photoURL: backupPhotoURL || null } : null);
              
              // Better error messages translating exact reasons
              let displayError = 'Upload failed';
              const errMsg = uploadErr.message || '';
              if (errMsg.includes('Permission denied')) {
                displayError = 'Permission denied. Please check Firestore/Storage rules.';
              } else if (errMsg.includes('Storage bucket not configured')) {
                displayError = 'Storage bucket not configured. Please verify your Firebase setup.';
              } else if (errMsg.includes('Authentication expired')) {
                displayError = 'Authentication expired. Please sign in again.';
              } else if (errMsg.includes('Network timeout')) {
                displayError = 'Upload failed. Please check your internet connection or Firebase Storage configuration.';
              } else if (errMsg.includes('File too large')) {
                displayError = 'File too large.';
              } else if (errMsg.includes('Unsupported image type')) {
                displayError = 'Unsupported image type.';
              } else {
                displayError = `Upload failed: ${errMsg}`;
              }
              
              addToast(displayError, 'error');
            } finally {
              setUploadProgress(null);
            }
          }, 'image/webp', 0.8);
        };
        img.src = localPreview;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('[AVATAR UPLOAD ERROR]', err);
      addToast('Failed to read image file', 'error');
      setUploadProgress(null);
    }
  };

  // Create task for a specific date (from calendar clicking)
  const handleAddTaskForDate = (dateStr: string) => {
    setAddDueDate(dateStr);
    setShowAddModal(true);
  };

  // Tab change
  const handleTabChange = (tab: 'home' | 'completed' | 'insights' | 'profile' | 'settings') => {
    setSwingTab(tab);
    setSelectedTaskId(null);
  };

  // Process lists
  let processedTasks = taskService.current!.getProcessedTasks(searchQuery, searchType, filterBy, sortBy);

  // Apply Priority Filter for Home View
  if (homePriorityFilter !== 'All') {
    const priorityMap: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
    const val = priorityMap[homePriorityFilter];
    processedTasks = processedTasks.filter(t => t.priority === val);
  }

  // Apply Category Filter for Home View
  if (homeCategoryFilter !== 'All') {
    processedTasks = processedTasks.filter(t => t.category === homeCategoryFilter);
  }

  if (selectedCalendarDate) {
    const parseTaskDate = (dStr: string) => {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return dStr;
    };
    processedTasks = processedTasks.filter(t => parseTaskDate(t.dueDate) === selectedCalendarDate);
  } else {
    // Restrict Home view to ONLY display Today's Tasks and Overdue Tasks
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const endOfToday = new Date();
    endOfToday.setHours(23,59,59,999);

    const parseTaskDateToTime = (dStr: string) => {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
      }
      return new Date(dStr).getTime();
    };

    processedTasks = processedTasks.filter(t => {
      const taskTime = parseTaskDateToTime(t.dueDate);
      const isDueToday = taskTime >= startOfToday.getTime() && taskTime <= endOfToday.getTime();
      const isOverdue = t.status === 'Pending' && taskTime < startOfToday.getTime();
      return isDueToday || isOverdue;
    });
  }

  // Apply client-side sort direction (Reverse Order)
  if (sortDirection === 'desc') {
    processedTasks = [...processedTasks].reverse();
  }

  const processedCompletedTasks = taskService.current!.getProcessedCompletedTasks(
    completedSearchQuery,
    completedSearchType,
    completedPriorityFilter
  );

  const activeCount = tasks.filter(t => t.status !== 'Completed').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;

  const smartStats = taskService.current?.getSmartStatistics() || {
    pendingToday: 0,
    overdue: 0,
    completedToday: 0,
    
    todayProgress: { completed: 0, total: 0 },

    currentDailyStreak: 0,
    bestDailyStreak: 0,
    weeklyStreak: 0,
    monthlyStreak: 0,

    overallCompletionRate: 0,
    averageCompletionRate: 0,

    completionRate: 0,
    streak: 0,
    lastCompletedDate: null
  };

  const graphData = taskService.current?.getCompletionGraphData(graphRange, customStartDate, customEndDate) || [];

  const renderTaskCard = (task: any, index: number) => {
    const isCompleting = completionStages[task.taskId] !== undefined;
    const compStage = completionStages[task.taskId];
    
    // Visual properties dynamically adjusted
    let cardOpacityClass = 'opacity-100';
    let titleClass = 'text-white';
    let descClass = 'text-white/60';
    let isCheckIconChecked = false;

    if (compStage === 'checked') {
      isCheckIconChecked = true;
    } else if (compStage === 'strikethrough') {
      titleClass = 'line-through text-white/30';
      descClass = 'line-through text-white/20';
      isCheckIconChecked = true;
    } else if (compStage === 'fade') {
      cardOpacityClass = 'opacity-30';
      titleClass = 'line-through text-white/30';
      descClass = 'line-through text-white/20';
      isCheckIconChecked = true;
    } else if (compStage === 'collapse') {
      cardOpacityClass = 'opacity-0 h-0 p-0 my-0 overflow-hidden';
    }

    const parseDateVal = (dStr: string) => {
      if (!dStr) return 0;
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
      }
      return new Date(dStr).getTime();
    };
    const today = new Date();
    today.setHours(0,0,0,0);
    const isOverdue = task.status === 'Pending' && parseDateVal(task.dueDate) < today.getTime();

    const displayRank = `#${index + 1}`;
    const showRank = sortBy === 'priority';

    return (
      <motion.div
        key={task.taskId}
        onClick={() => setSelectedTaskId(task.taskId)}
        variants={cardVariants}
        exit={{ opacity: 0, scale: 0.98, y: -4, height: 0, padding: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
        className={`w-full ${cardOpacityClass}`}
      >
        {/* DESKTOP CARD VIEW - Unchanged & Pixel-Perfect */}
        <div className={`hidden lg:flex px-4 py-3 border-b border-white/[0.03] items-center justify-between gap-4 cursor-pointer transition-colors ${
          selectedTaskId === task.taskId ? 'bg-white/[0.03]' : 'bg-transparent hover:bg-white/[0.01]'
        }`}>
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <span className="text-[9px] font-medium font-mono text-white/30 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded-sm select-none shrink-0">
              {displayRank}
            </span>
            
            <div className="min-w-0 flex-1 flex flex-col md:flex-row md:items-center md:gap-4">
              <h4 className={`text-xs font-semibold tracking-tight ${titleClass} truncate md:w-1/3 shrink-0`}>
                {task.title}
              </h4>
              {task.description ? (
                <p className={`text-[11px] ${descClass} truncate flex-1`}>
                  {task.description}
                </p>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 text-[10px] text-white/40 select-none">
            <span className="flex items-center gap-1 bg-white/[0.015] border border-white/[0.04] px-2 py-0.5 rounded-sm whitespace-nowrap text-[9px] font-semibold tracking-wide uppercase">
              {task.priority === 3 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
            </span>
            <span className="flex items-center gap-1 bg-white/[0.015] border border-white/[0.04] px-2 py-0.5 rounded-sm whitespace-nowrap text-[9px]">
              {getCategoryIcon(task.category)}
              <span>{task.category}</span>
            </span>
            <span className={`flex items-center gap-1.5 bg-white/[0.015] border border-white/[0.04] px-2 py-0.5 rounded-sm whitespace-nowrap text-[9px] ${isOverdue ? 'text-red-400 bg-red-500/5 border-red-500/10' : ''}`}>
              <Calendar className="w-3 h-3 text-white/30" />
              <span>
                {formatDueDateShort(task.dueDate)}
                {task.dueTime ? ` • ${formatTo12Hour(task.dueTime).replace(/^0/, '')}` : ''}
              </span>
            </span>

            <div className="flex items-center gap-1 border-l border-white/[0.04] pl-2 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); triggerCompleteTask(task.taskId); }}
                className={`p-1 rounded-sm transition-colors cursor-pointer ${
                  isCheckIconChecked ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/20 hover:text-emerald-400 hover:bg-white/[0.03]'
                }`}
                title="Complete Task"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const parts = task.dueDate.split('/');
                  const isoDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : task.dueDate;
                  setShowEditModal({ ...task, dueDate: isoDate });
                }}
                className="p-1 text-white/20 hover:text-amber-400 hover:bg-white/[0.03] rounded-sm cursor-pointer transition-colors"
                title="Edit Task"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); triggerDeleteTask(task.taskId); }}
                className="p-1 text-white/20 hover:text-red-400 hover:bg-white/[0.03] rounded-sm cursor-pointer transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE CARD VIEW - Hierarchical, high contrast, clean spacing */}
        <div className={`lg:hidden px-6 pt-6 pb-7 border rounded-xl transition-all flex flex-col gap-3.5 select-none ${
          selectedTaskId === task.taskId
            ? 'bg-[#121214] border-[#7C5CFF]/30 shadow-md shadow-[#7C5CFF]/5'
            : 'bg-white/[0.015] border-white/[0.05] hover:bg-white/[0.03]'
        }`}>
          {/* Row 1: Task Title & (optional) Rank Badge */}
          <div className="flex items-start gap-2.5">
            {showRank && (
              <span className="text-[10px] font-bold font-mono text-white/40 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded-md select-none shrink-0 mt-0.5">
                {displayRank}
              </span>
            )}
            <div className="space-y-1 min-w-0 flex-1">
              <h4 className={`text-base font-bold tracking-tight text-white leading-snug break-words ${titleClass}`}>
                {task.title}
              </h4>
              {task.description && (
                <p className={`text-xs leading-relaxed text-white/40 break-words ${descClass}`}>
                  {task.description}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Category Badge */}
          <div className="flex items-center">
            <span className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-md text-xs text-white/60">
              {getCategoryIcon(task.category)}
              <span>{task.category}</span>
            </span>
          </div>

          {/* Row 3: Due Date + Due Time */}
          <div className="flex items-center">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono ${
              isOverdue
                ? 'text-red-300 bg-white/[0.06] border-white/[0.08] font-bold'
                : 'text-white/50 bg-white/[0.02] border border-white/[0.04]'
            }`}>
              {isOverdue ? (
                <Clock className="w-3.5 h-3.5 text-red-300 shrink-0" />
              ) : (
                <Calendar className="w-3.5 h-3.5 text-white/30" />
              )}
              <span>
                {formatDueDateShort(task.dueDate)}
                {task.dueTime ? ` • ${formatTo12Hour(task.dueTime).replace(/^0/, '')}` : ''}
              </span>
            </span>
          </div>

          {/* Row 4: Priority Badge */}
          <div className="flex items-center">
            <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md border ${
              task.priority === 3
                ? 'text-red-400 bg-red-500/5 border-red-500/10'
                : task.priority === 2
                ? 'text-amber-400 bg-amber-500/5 border-amber-500/10'
                : 'text-blue-400 bg-blue-500/5 border-blue-500/10'
            }`}>
              {task.priority === 3 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
            </span>
          </div>

          {/* Row 5: Actions - Compact icon buttons with 48px height touch targets */}
          <div className="flex items-center gap-3 border-t border-white/[0.04] pt-4 shrink-0 justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); triggerCompleteTask(task.taskId); }}
              className={`h-12 w-12 flex items-center justify-center rounded-xl cursor-pointer transition-all ${
                isCheckIconChecked
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-white/30 bg-white/[0.01] border border-white/[0.04] hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20'
              }`}
              title="Complete Task"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const parts = task.dueDate.split('/');
                const isoDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : task.dueDate;
                setShowEditModal({ ...task, dueDate: isoDate });
              }}
              className="h-12 w-12 flex items-center justify-center rounded-xl text-white/30 bg-white/[0.01] border border-white/[0.04] hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20 transition-all cursor-pointer"
              title="Edit Task"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); triggerDeleteTask(task.taskId); }}
              className="h-12 w-12 flex items-center justify-center rounded-xl text-white/30 bg-white/[0.01] border border-white/[0.04] hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
              title="Delete Task"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const sidebarIcons: Record<string, React.ComponentType<any>> = {
    home: Home,
    completed: CheckCircle2,
    insights: BarChart2,
    profile: User,
    settings: Settings
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen w-full bg-[#000000] text-white flex flex-col justify-center items-center select-none">
        <div className="w-10 h-10 border-2 border-[#7C5CFF]/30 border-t-[#7C5CFF] rounded-full animate-spin mb-4" />
        <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase">SECURE WORKSPACE INITIALIZING...</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen 
        authService={authService.current!} 
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          addTerminalLog(`[SYSTEM] Welcome back, ${user.displayName || user.email}`);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white/90 grid grid-cols-1 lg:grid-cols-[240px_1fr] font-sans select-none selection:bg-[#7C5CFF]/30 selection:text-white overflow-hidden">
      
      {/* MOBILE NAVIGATION DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-black border-r border-white/[0.06] z-50 p-5 flex flex-col justify-between lg:hidden shadow-2xl"
            >
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-[10px] font-bold text-[#7C5CFF] tracking-widest uppercase font-mono pl-1">
                      To-Do List
                    </span>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-1.5 text-white/40 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <span className="text-[10px] font-bold text-white/20 tracking-wider uppercase pl-3 block mb-4 select-none font-mono">
                    Workspace
                  </span>

                  <div className="flex flex-col gap-1.5">
                    {[
                      { id: 'home', label: 'Home' },
                      { id: 'completed', label: 'Completed' },
                      { id: 'insights', label: 'Insights' }
                    ].map(btn => {
                      const isActive = swingTab === btn.id;
                      const IconComponent = sidebarIcons[btn.id];
                      return (
                        <button
                          key={btn.id}
                          onClick={() => {
                            handleTabChange(btn.id as any);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full py-3 px-4 rounded-xl text-left text-sm font-medium transition-all duration-150 cursor-pointer flex items-center select-none ${
                            isActive ? 'text-white bg-white/[0.06] font-semibold' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            {IconComponent && <IconComponent className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-white/40'}`} />}
                            {btn.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/[0.04]">
                  <div className="flex flex-col gap-1.5">
                    {[
                      { id: 'profile', label: 'Profile' },
                      { id: 'settings', label: 'Settings' }
                    ].map(btn => {
                      const isActive = swingTab === btn.id;
                      const IconComponent = sidebarIcons[btn.id];
                      return (
                        <button
                          key={btn.id}
                          onClick={() => {
                            handleTabChange(btn.id as any);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full py-3 px-4 rounded-xl text-left text-sm font-medium transition-all duration-150 cursor-pointer flex items-center select-none ${
                            isActive ? 'text-white bg-white/[0.06] font-semibold' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            {IconComponent && <IconComponent className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-white/40'}`} />}
                            {btn.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-3 pt-1 flex flex-col gap-1.5 select-none text-[9px] font-mono text-white/20">
                    <span>Secure Cloud Workspace</span>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full mt-2 text-left text-[11px] font-semibold text-red-400/80 hover:text-red-400 cursor-pointer flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-400/60" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR - continuous from top to bottom */}
      <div className="hidden lg:flex w-[240px] bg-[#000000] border-r border-white/[0.04] p-5 flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
        <div className="flex-1 flex flex-col justify-between">
          {/* TOP NAVIGATION GROUP */}
          <div>
            <span className="text-[10px] font-bold text-white/20 tracking-wider uppercase pl-3 block mb-4 select-none font-mono">
              Workspace
            </span>

            <div className="flex flex-col gap-1.5">
              {[
                { id: 'home', label: 'Home' },
                { id: 'completed', label: 'Completed' },
                { id: 'insights', label: 'Insights' }
              ].map(btn => {
                const isActive = swingTab === btn.id;
                const IconComponent = sidebarIcons[btn.id];
                return (
                  <button
                    key={btn.id}
                    onClick={() => handleTabChange(btn.id as any)}
                    className={`w-full py-1.5 px-3 rounded text-left text-xs font-medium transition-all duration-150 cursor-pointer flex items-center select-none ${
                      isActive ? 'text-white bg-white/[0.06] font-semibold' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {IconComponent && <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-white/40'}`} />}
                      {btn.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BOTTOM NAVIGATION GROUP */}
          <div className="space-y-4 pt-4 border-t border-white/[0.04]">
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'profile', label: 'Profile' },
                { id: 'settings', label: 'Settings' }
              ].map(btn => {
                const isActive = swingTab === btn.id;
                const IconComponent = sidebarIcons[btn.id];
                return (
                  <button
                    key={btn.id}
                    onClick={() => handleTabChange(btn.id as any)}
                    className={`w-full py-1.5 px-3 rounded text-left text-xs font-medium transition-all duration-150 cursor-pointer flex items-center select-none ${
                      isActive ? 'text-white bg-white/[0.06] font-semibold' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {IconComponent && <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-white/40'}`} />}
                      {btn.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Connected Indicator near Profile Section */}
            <div className="px-3 pt-1 flex flex-col gap-1.5 select-none text-[9px] font-mono text-white/20">
              <span>Secure Cloud Workspace</span>
              <button
                onClick={handleLogout}
                className="w-full mt-2 text-left text-[11px] font-semibold text-red-400/80 hover:text-red-400 cursor-pointer flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400/60" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE VIEWPORT */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0B0B0C] no-scrollbar-mobile">
        
        {/* MOBILE TOP BAR */}
        <div className="lg:hidden flex items-center justify-between bg-[#000000] border-b border-white/[0.04] h-14 px-4 sticky top-0 z-40 select-none shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-white/60 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-xs font-bold tracking-widest uppercase text-white/90">
            To-Do List
          </span>
          <div className="w-10 h-10 flex items-center justify-center">
            {/* Quick avatar inside top bar */}
            <div 
              onClick={() => handleTabChange('profile')}
              className="w-7 h-7 rounded-full overflow-hidden border border-white/10 cursor-pointer"
            >
              {userProfileData?.photoURL ? (
                <img 
                  src={userProfileData.photoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#7C5CFF] to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase select-none">
                  {getInitials(userProfileData?.name || userProfileData?.displayName || 'U')}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full max-w-[1200px] mx-auto flex-1 flex flex-col justify-start p-4 sm:p-6 lg:p-12">
            
            {/* SWING SUB-VIEW: HOME */}
            {swingTab === 'home' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Header greeting & Subtitle */}
                <div className="flex flex-col gap-1 pb-4 border-b border-white/[0.04]">
                  {(() => {
                    const { greeting } = getDynamicGreeting(userProfileData, currentUser, tasks);
                    const today = new Date();
                    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                    return (
                      <>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white select-none">
                          {greeting}
                        </h1>
                        <p className="text-white/40 text-xs sm:text-sm font-medium flex items-center gap-1.5 pl-0.5">
                          <Calendar className="w-3.5 h-3.5 text-white/30" />
                          <span>{dateStr}</span>
                        </p>
                      </>
                    );
                  })()}
                </div>

                {/* STATS (MOBILE) - Redesigned into compact scannable pills with elegant styling */}
                <div className="lg:hidden grid grid-cols-2 gap-2.5 w-full pt-1 select-none">
                  <div className="bg-white/[0.015] border border-white/[0.04] px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono truncate">Completed</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 font-mono">{smartStats.completedToday}</span>
                  </div>

                  <div className="bg-white/[0.015] border border-white/[0.04] px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-[#7C5CFF] shrink-0" />
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono truncate">Pending</span>
                    </div>
                    <span className="text-xs font-bold text-white font-mono">{smartStats.pendingToday}</span>
                  </div>

                  <div className="bg-white/[0.015] border border-white/[0.04] px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono truncate">Overdue</span>
                    </div>
                    <span className={`text-xs font-bold font-mono ${smartStats.overdue > 0 ? 'text-red-400' : 'text-white/40'}`}>{smartStats.overdue}</span>
                  </div>

                  <div className="bg-white/[0.015] border border-white/[0.04] px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider truncate font-sans">Progress</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-400 font-mono">
                      {smartStats.todayProgress.total > 0 ? Math.round((smartStats.todayProgress.completed / smartStats.todayProgress.total) * 100) : 0}%
                    </span>
                  </div>
                </div>

                {/* Single lightweight summary row (DESKTOP) */}
                <div className="hidden lg:flex flex-wrap items-center gap-x-2 text-[10px] font-semibold font-mono uppercase tracking-wider text-white/30 py-0.5 select-none">
                  <span>{smartStats.completedToday} Completed Today</span>
                  <span className="text-white/10">•</span>
                  <span>{smartStats.pendingToday} Pending</span>
                  <span className="text-white/10">•</span>
                  <span className={smartStats.overdue > 0 ? 'text-red-400 font-bold' : ''}>{smartStats.overdue} Overdue</span>
                  <span className="text-white/10">•</span>
                  <span>Today's Progress {smartStats.todayProgress.total > 0 ? Math.round((smartStats.todayProgress.completed / smartStats.todayProgress.total) * 100) : 0}%</span>
                </div>

                {/* Unified Toolbar (DESKTOP) */}
                <div className="hidden lg:flex flex-row items-center gap-2 bg-white/[0.015] border border-white/[0.04] rounded p-1 w-full text-xs">
                  {/* Search input - occupies left side */}
                  <div className="relative flex-1 flex items-center h-8">
                    <Search className="absolute left-2.5 w-3.5 h-3.5 text-white/30" />
                    <input
                      type="text"
                      placeholder="Search pending tasks..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full h-full bg-transparent text-xs text-white placeholder-white/20 pl-8 pr-6 focus:outline-none"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2 text-white/40 hover:text-white text-xs cursor-pointer">✕</button>
                    )}
                  </div>

                  {/* Filter elements & Button - right aligned */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 sm:ml-auto">
                    {/* Search Type */}
                    <select
                      value={searchType}
                      onChange={e => setSearchType(e.target.value as any)}
                      className="bg-transparent hover:bg-white/[0.02] border border-white/[0.05] rounded-sm text-[11px] text-white/50 hover:text-white px-2 py-1 h-8 cursor-pointer focus:outline-none"
                    >
                      <option value="title" className="bg-[#0D0D0E]">By Title</option>
                      <option value="id" className="bg-[#0D0D0E]">By ID</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={filterBy}
                      onChange={e => setFilterBy(e.target.value as any)}
                      className="bg-transparent hover:bg-white/[0.02] border border-white/[0.05] rounded-sm text-[11px] text-white/50 hover:text-white px-2 py-1 h-8 cursor-pointer focus:outline-none"
                    >
                      <option value="All Active" className="bg-[#0D0D0E]">All Status</option>
                      <option value="Pending" className="bg-[#0D0D0E]">Pending</option>
                      <option value="Overdue" className="bg-[#0D0D0E]">Overdue</option>
                    </select>

                    {/* Category Filter */}
                    <select
                      value={homeCategoryFilter}
                      onChange={e => setHomeCategoryFilter(e.target.value as any)}
                      className="bg-transparent hover:bg-white/[0.02] border border-white/[0.05] rounded-sm text-[11px] text-white/50 hover:text-white px-2 py-1 h-8 cursor-pointer focus:outline-none"
                    >
                      <option value="All" className="bg-[#0D0D0E]">All Categories</option>
                      <option value="Work" className="bg-[#0D0D0E]">Work</option>
                      <option value="Personal" className="bg-[#0D0D0E]">Personal</option>
                      <option value="Shopping" className="bg-[#0D0D0E]">Shopping</option>
                      <option value="Health" className="bg-[#0D0D0E]">Health</option>
                      <option value="Education" className="bg-[#0D0D0E]">Education</option>
                      <option value="Others" className="bg-[#0D0D0E]">Others</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                      value={homePriorityFilter}
                      onChange={e => setHomePriorityFilter(e.target.value as any)}
                      className="bg-transparent hover:bg-white/[0.02] border border-white/[0.05] rounded-sm text-[11px] text-white/50 hover:text-white px-2 py-1 h-8 cursor-pointer focus:outline-none"
                    >
                      <option value="All" className="bg-[#0D0D0E]">All Priorities</option>
                      <option value="High" className="bg-[#0D0D0E]">High</option>
                      <option value="Medium" className="bg-[#0D0D0E]">Medium</option>
                      <option value="Low" className="bg-[#0D0D0E]">Low</option>
                    </select>

                    {/* Sort order */}
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="bg-transparent hover:bg-white/[0.02] border border-white/[0.05] rounded-sm text-[11px] text-white/50 hover:text-white px-2 py-1 h-8 cursor-pointer focus:outline-none"
                    >
                      <option value="priority" className="bg-[#0D0D0E]">Priority DESC</option>
                      <option value="duedate" className="bg-[#0D0D0E]">Due Date ASC</option>
                      <option value="id" className="bg-[#0D0D0E]">Task ID ASC</option>
                      <option value="title" className="bg-[#0D0D0E]">Alphabetical</option>
                    </select>

                    {/* Add Task button */}
                    <button
                      onClick={() => {
                        setAddDueDate(selectedCalendarDate || '');
                        setShowAddModal(true);
                      }}
                      className="bg-[#7C5CFF] hover:bg-[#8D72FF] text-white text-[11px] font-semibold px-3 py-1 h-8 rounded-sm cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Task</span>
                    </button>
                  </div>
                </div>

                {/* MOBILE ADD TASK & FILTERS CONTROLS */}
                <div className="lg:hidden flex flex-col gap-3.5 w-full">
                  {/* Create Task Button (Always visible at top, easy to click) */}
                  <button
                    onClick={() => {
                      setAddDueDate(selectedCalendarDate || '');
                      setShowAddModal(true);
                    }}
                    className="w-full h-11 bg-[#7C5CFF] hover:bg-[#8D72FF] text-white text-xs sm:text-sm font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#7C5CFF]/15 active:scale-[0.98]"
                  >
                    <Plus className="w-4.5 h-4.5" />
                    <span>Create New Task</span>
                  </button>

                  {/* Search Bar + Sliders/Filters Toggle Button */}
                  <div className="relative w-full flex flex-col gap-2">
                    <div className="flex items-center gap-2 w-full">
                      {/* Search Field */}
                      <div className="relative flex-1 h-11 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center px-3.5 focus-within:border-white/15 transition-colors">
                        <Search className="w-4 h-4 text-white/40 mr-2.5 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search tasks..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full h-5 bg-transparent text-xs font-semibold text-white placeholder-white/20 border-0 p-0 m-0 focus:ring-0 focus:outline-none self-center leading-none"
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white p-1 text-sm cursor-pointer ml-1 shrink-0">✕</button>
                        )}
                      </div>

                      {/* Filter & Sort Button */}
                      <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`h-11 px-4 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all text-xs font-semibold select-none shrink-0 ${
                          isFilterOpen || filterBy !== 'All Active' || homeCategoryFilter !== 'All' || homePriorityFilter !== 'All' || sortBy !== 'priority'
                            ? 'bg-[#7C5CFF]/15 border-[#7C5CFF]/30 text-[#8D72FF]'
                            : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <SlidersHorizontal className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">Filter & Sort</span>
                        {(filterBy !== 'All Active' || homeCategoryFilter !== 'All' || homePriorityFilter !== 'All' || sortBy !== 'priority') && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7C5CFF] shrink-0" />
                        )}
                      </button>
                    </div>

                    {/* Filter & Sort Dropdown panel */}
                    <AnimatePresence>
                      {isFilterOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-12 right-0 left-0 bg-[#0F0F11] border border-white/[0.06] rounded-xl p-4 shadow-2xl z-30 space-y-4 animate-fadeIn"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Filter & Sort Settings</span>
                            <button
                              onClick={() => {
                                setFilterBy('All Active');
                                setHomeCategoryFilter('All');
                                setHomePriorityFilter('All');
                                setSortBy('priority');
                                setSortDirection('asc');
                                setSearchType('title');
                              }}
                              className="text-[9px] font-bold text-[#7C5CFF] hover:underline font-mono cursor-pointer"
                            >
                              Reset All
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3.5">
                            {/* Search Type */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold font-mono text-white/30 uppercase tracking-wider pl-1">Search Type</span>
                              <select
                                value={searchType}
                                onChange={e => setSearchType(e.target.value as any)}
                                className="w-full h-10 bg-white/[0.02] border border-white/[0.05] rounded-lg px-2.5 text-xs text-white/80 focus:outline-none cursor-pointer"
                              >
                                <option value="title" className="bg-[#0D0D0E]">By Title</option>
                                <option value="id" className="bg-[#0D0D0E]">By ID</option>
                              </select>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold font-mono text-white/30 uppercase tracking-wider pl-1">Status</span>
                              <select
                                value={filterBy}
                                onChange={e => setFilterBy(e.target.value as any)}
                                className="w-full h-10 bg-white/[0.02] border border-white/[0.05] rounded-lg px-2.5 text-xs text-white/80 focus:outline-none cursor-pointer"
                              >
                                <option value="All Active" className="bg-[#0D0D0E]">All Active</option>
                                <option value="Pending" className="bg-[#0D0D0E]">Pending</option>
                                <option value="Overdue" className="bg-[#0D0D0E]">Overdue</option>
                              </select>
                            </div>

                            {/* Category */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold font-mono text-white/30 uppercase tracking-wider pl-1">Category</span>
                              <select
                                value={homeCategoryFilter}
                                onChange={e => setHomeCategoryFilter(e.target.value as any)}
                                className="w-full h-10 bg-white/[0.02] border border-white/[0.05] rounded-lg px-2.5 text-xs text-white/80 focus:outline-none cursor-pointer"
                              >
                                <option value="All" className="bg-[#0D0D0E]">All Categories</option>
                                <option value="Work" className="bg-[#0D0D0E]">Work</option>
                                <option value="Personal" className="bg-[#0D0D0E]">Personal</option>
                                <option value="Shopping" className="bg-[#0D0D0E]">Shopping</option>
                                <option value="Health" className="bg-[#0D0D0E]">Health</option>
                                <option value="Education" className="bg-[#0D0D0E]">Education</option>
                                <option value="Others" className="bg-[#0D0D0E]">Others</option>
                              </select>
                            </div>

                            {/* Priority */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold font-mono text-white/30 uppercase tracking-wider pl-1">Priority</span>
                              <select
                                value={homePriorityFilter}
                                onChange={e => setHomePriorityFilter(e.target.value as any)}
                                className="w-full h-10 bg-white/[0.02] border border-white/[0.05] rounded-lg px-2.5 text-xs text-white/80 focus:outline-none cursor-pointer"
                              >
                                <option value="All" className="bg-[#0D0D0E]">All Priorities</option>
                                <option value="High" className="bg-[#0D0D0E]">High</option>
                                <option value="Medium" className="bg-[#0D0D0E]">Medium</option>
                                <option value="Low" className="bg-[#0D0D0E]">Low</option>
                              </select>
                            </div>

                            {/* Sort By */}
                            <div className="flex flex-col gap-1 col-span-2">
                              <span className="text-[9px] font-bold font-mono text-white/30 uppercase tracking-wider pl-1">Sort By</span>
                              <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as any)}
                                className="w-full h-10 bg-white/[0.02] border border-white/[0.05] rounded-lg px-2.5 text-xs text-white/80 focus:outline-none cursor-pointer"
                              >
                                <option value="priority" className="bg-[#0D0D0E]">Highest Priority First</option>
                                <option value="duedate" className="bg-[#0D0D0E]">Earliest Due Date First</option>
                                <option value="id" className="bg-[#0D0D0E]">Oldest Created First</option>
                                <option value="title" className="bg-[#0D0D0E]">Alphabetical (A to Z)</option>
                              </select>
                            </div>

                            {/* Sort Direction */}
                            <div className="flex flex-col gap-1 col-span-2">
                              <span className="text-[9px] font-bold font-mono text-white/30 uppercase tracking-wider pl-1">Sort Direction</span>
                              <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-white/[0.01] border border-white/[0.04] rounded-lg text-[10px] font-bold">
                                <button
                                  onClick={() => setSortDirection('asc')}
                                  className={`py-1.5 rounded-md cursor-pointer transition-colors ${
                                    sortDirection === 'asc' ? 'bg-[#7C5CFF]/15 text-[#8D72FF]' : 'text-white/40 hover:text-white'
                                  }`}
                                >
                                  Standard Order
                                </button>
                                <button
                                  onClick={() => setSortDirection('desc')}
                                  className={`py-1.5 rounded-md cursor-pointer transition-colors ${
                                    sortDirection === 'desc' ? 'bg-[#7C5CFF]/15 text-[#8D72FF]' : 'text-white/40 hover:text-white'
                                  }`}
                                >
                                  Reverse Order
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                    {/* Date filter notice */}
                    {selectedCalendarDate && (
                      <div className="flex items-center justify-between bg-[#7C5CFF]/5 border border-[#7C5CFF]/15 rounded-xl px-4 py-2 text-[11px] text-[#B5A3FF]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7C5CFF] animate-pulse" />
                          Filtering active tasks scheduled for: <strong>{formatToDDMMYYYY(selectedCalendarDate)}</strong>
                        </span>
                        <button
                          onClick={() => setSelectedCalendarDate(null)}
                          className="text-[#A1A1AA] hover:text-white cursor-pointer font-bold"
                        >
                          Clear Date Filter
                        </button>
                      </div>
                    )}

                    {/* Task list array */}
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-6"
                    >
                      <AnimatePresence mode="popLayout">
                        {selectedCalendarDate ? (
                          <div key="calendar-date-tasks" className="space-y-3 animate-fadeIn">
                            <div className="flex items-center justify-between">
                              <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40 pl-1 select-none">
                                Tasks on {formatToDDMMYYYY(selectedCalendarDate)}
                              </h3>
                            </div>
                            <div className="space-y-2.5">
                              {processedTasks.length === 0 ? (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="text-center py-12 bg-white/[0.01] border border-white/[0.03] rounded-md"
                                >
                                  <Sparkles className="w-5 h-5 text-white/20 mx-auto mb-2" />
                                  <p className="text-xs text-white/40 font-mono">No active tasks found for this date.</p>
                                </motion.div>
                              ) : (
                                processedTasks.map((task, index) => renderTaskCard(task, index))
                              )}
                            </div>
                          </div>
                        ) : (
                          <div key="today-overdue-wrapper" className="space-y-6">
                            {/* Overdue Section */}
                            {(() => {
                              const startOfToday = new Date();
                              startOfToday.setHours(0,0,0,0);
                              
                              const parseDateVal = (dStr: string) => {
                                if (!dStr) return 0;
                                const parts = dStr.split('/');
                                if (parts.length === 3) {
                                  return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
                                }
                                return new Date(dStr).getTime();
                              };
                              
                              const overdueTasks = processedTasks.filter(t => t.status === 'Pending' && parseDateVal(t.dueDate) < startOfToday.getTime());
                              const todayTasks = processedTasks.filter(t => parseDateVal(t.dueDate) >= startOfToday.getTime());
 
                              return (
                                <>
                                  {overdueTasks.length > 0 && (
                                    <div className="space-y-3">
                                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-red-400/80 pl-1 select-none">
                                        Overdue Tasks
                                      </h3>
                                      <div className="space-y-2.5">
                                        {overdueTasks.map((task, index) => renderTaskCard(task, index))}
                                      </div>
                                    </div>
                                  )}
 
                                  {todayTasks.length > 0 && (
                                    <div className="space-y-3">
                                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40 pl-1 select-none">
                                        Today's Tasks
                                      </h3>
                                      <div className="space-y-2.5">
                                        {todayTasks.map((task, index) => renderTaskCard(task, index + overdueTasks.length))}
                                      </div>
                                    </div>
                                  )}
 
                                  {overdueTasks.length === 0 && todayTasks.length === 0 && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="w-full bg-white/[0.015] border border-white/[0.04] rounded p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto shadow-sm"
                                    >
                                      <Sparkles className="w-5 h-5 text-white/20" />
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold text-white">No pending tasks</p>
                                        <p className="text-[11px] text-white/40 leading-relaxed">
                                          Your workspace is clear. Create a new task to get started on your agenda.
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setAddDueDate(selectedCalendarDate || '');
                                          setShowAddModal(true);
                                        }}
                                        className="bg-[#7C5CFF] hover:bg-[#8D72FF] text-white text-[11px] font-medium h-8 px-4 rounded cursor-pointer transition-colors"
                                      >
                                        Create Task
                                      </button>
                                    </motion.div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                )}

                     {/* SWING SUB-VIEW: COMPLETED */}
            {swingTab === 'completed' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white tracking-tight select-none">
                      Completed Tasks
                    </h2>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-sm font-semibold font-mono flex items-center gap-1 shrink-0 select-none uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5" />
                    {completedCount} Completed
                  </span>
                </div>

                {/* Unified Toolbar Completed (DESKTOP) */}
                <div className="hidden lg:flex flex-row items-center gap-2 bg-white/[0.015] border border-white/[0.04] rounded p-1 w-full text-xs">
                  {/* Search input - occupies left side */}
                  <div className="relative flex-1 flex items-center h-8">
                    <Search className="absolute left-2.5 w-3.5 h-3.5 text-white/30" />
                    <input
                      type="text"
                      placeholder="Search completed tasks..."
                      value={completedSearchQuery}
                      onChange={e => setCompletedSearchQuery(e.target.value)}
                      className="w-full h-full bg-transparent text-xs text-white placeholder-white/20 pl-8 pr-6 focus:outline-none"
                    />
                    {completedSearchQuery && (
                      <button onClick={() => setCompletedSearchQuery('')} className="absolute right-2 text-white/40 hover:text-white text-xs cursor-pointer">✕</button>
                    )}
                  </div>

                  {/* Filter elements & Button - right aligned */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 sm:ml-auto">
                    {/* Search Type */}
                    <select
                      value={completedSearchType}
                      onChange={e => setCompletedSearchType(e.target.value as any)}
                      className="bg-transparent hover:bg-white/[0.02] border border-white/[0.05] rounded-sm text-[11px] text-white/50 hover:text-white px-2 py-1 h-8 cursor-pointer focus:outline-none"
                    >
                      <option value="title" className="bg-[#0D0D0E]">By Title</option>
                      <option value="id" className="bg-[#0D0D0E]">By ID</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                      value={completedPriorityFilter}
                      onChange={e => setCompletedPriorityFilter(e.target.value as any)}
                      className="bg-transparent hover:bg-white/[0.02] border border-white/[0.05] rounded-sm text-[11px] text-white/50 hover:text-white px-2 py-1 h-8 cursor-pointer focus:outline-none"
                    >
                      <option value="All" className="bg-[#0D0D0E]">All Priorities</option>
                      <option value="High" className="bg-[#0D0D0E]">High</option>
                      <option value="Medium" className="bg-[#0D0D0E]">Medium</option>
                      <option value="Low" className="bg-[#0D0D0E]">Low</option>
                    </select>
                  </div>
                </div>

                {/* Unified Toolbar Completed (MOBILE) */}
                <div className="lg:hidden flex flex-col gap-3.5 w-full">
                  <div className="relative w-full h-12 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center px-3.5">
                    <Search className="w-4 h-4 text-white/40 mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search completed tasks..."
                      value={completedSearchQuery}
                      onChange={e => setCompletedSearchQuery(e.target.value)}
                      className="w-full h-full bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
                    />
                    {completedSearchQuery && (
                      <button onClick={() => setCompletedSearchQuery('')} className="text-white/40 hover:text-white p-2 text-sm cursor-pointer">✕</button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold font-mono text-white/30 uppercase tracking-wider pl-1">Search Type</span>
                      <select
                        value={completedSearchType}
                        onChange={e => setCompletedSearchType(e.target.value as any)}
                        className="w-full h-12 bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 text-xs text-white/80 focus:border-white/25 focus:ring-1 focus:ring-white/20 focus:outline-none cursor-pointer"
                      >
                        <option value="title" className="bg-[#0D0D0E]">By Title</option>
                        <option value="id" className="bg-[#0D0D0E]">By ID</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold font-mono text-white/30 uppercase tracking-wider pl-1">Priority</span>
                      <select
                        value={completedPriorityFilter}
                        onChange={e => setCompletedPriorityFilter(e.target.value as any)}
                        className="w-full h-12 bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 text-xs text-white/80 focus:border-white/25 focus:ring-1 focus:ring-white/20 focus:outline-none cursor-pointer"
                      >
                        <option value="All" className="bg-[#0D0D0E]">All Priorities</option>
                        <option value="High" className="bg-[#0D0D0E]">High</option>
                        <option value="Medium" className="bg-[#0D0D0E]">Medium</option>
                        <option value="Low" className="bg-[#0D0D0E]">Low</option>
                      </select>
                    </div>
                  </div>
                </div>
 
                {/* Completed cards list */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  <AnimatePresence mode="popLayout">
                    {processedCompletedTasks.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full bg-white/[0.015] border border-white/[0.04] rounded p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto shadow-sm"
                      >
                        <Award className="w-5 h-5 text-white/20" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-white">Your completed queue is empty</p>
                          <p className="text-[11px] text-white/40 leading-relaxed">
                            Finish pending items from your workspace to populate your archive.
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      processedCompletedTasks.map((task, index) => {
                        const displayRank = `#${index + 1}`;
                        return (
                          <motion.div
                            key={task.taskId}
                            variants={cardVariants}
                            exit={{ opacity: 0, scale: 0.98, y: -4, height: 0, padding: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
                            className="w-full"
                          >
                            {/* DESKTOP VIEW - Unchanged */}
                            <div className="hidden lg:flex px-4 py-3 border-b border-white/[0.03] items-center justify-between gap-4 transition-colors bg-transparent hover:bg-white/[0.01]">
                              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                <span className="text-[9px] font-medium font-mono text-white/30 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded-sm select-none shrink-0">
                                  {displayRank}
                                </span>
                                
                                <div className="min-w-0 flex-1 flex flex-col md:flex-row md:items-center md:gap-4">
                                  <h4 className="text-xs font-semibold tracking-tight text-white/30 line-through truncate md:w-1/3 shrink-0">
                                    {task.title}
                                  </h4>
                                  {task.description ? (
                                    <p className="text-[11px] text-white/20 truncate line-through flex-1">
                                      {task.description}
                                    </p>
                                  ) : (
                                    <div className="flex-1" />
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0 text-[10px] text-white/40 select-none">
                                <span className="flex items-center gap-1 bg-white/[0.015] border border-white/[0.04] px-2 py-0.5 rounded-sm whitespace-nowrap text-[9px] font-semibold tracking-wide uppercase">
                                  {task.priority === 3 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
                                </span>
                                <span className="flex items-center gap-1 bg-white/[0.015] border border-white/[0.04] px-2 py-0.5 rounded-sm whitespace-nowrap text-[9px]">
                                  {getCategoryIcon(task.category)}
                                  <span>{task.category}</span>
                                </span>
                                {task.completedDate && (
                                  <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-sm border border-emerald-500/10 font-mono whitespace-nowrap text-[9px]">
                                    ✓ Completed: {task.completedDate}
                                  </span>
                                )}

                                <div className="flex items-center gap-1 border-l border-white/[0.04] pl-2 shrink-0">
                                  <button
                                    onClick={() => triggerRevertComplete(task.taskId)}
                                    className="text-[9px] font-semibold px-2 py-1 bg-white/[0.015] border border-white/[0.05] hover:bg-white/[0.03] text-white/50 hover:text-white rounded-sm cursor-pointer transition-colors"
                                  >
                                    Restore
                                  </button>
                                  <button
                                    onClick={() => triggerDeleteTask(task.taskId)}
                                    className="p-1 text-white/20 hover:text-red-400 hover:bg-white/[0.03] rounded-sm cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* MOBILE VIEW - Beautifully stacked & comfortable */}
                            <div className="lg:hidden p-4 bg-[#121214]/50 border border-white/[0.04] rounded-2xl flex flex-col gap-3.5 select-none my-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold font-mono text-white/30 bg-white/[0.02] border border-white/[0.05] px-2.5 py-0.5 rounded-md">
                                  {displayRank}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 border border-white/[0.08] px-2.5 py-1 rounded-md">
                                  {task.priority === 3 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
                                </span>
                              </div>

                              <div className="space-y-1 min-w-0">
                                <h4 className="text-base font-semibold tracking-tight text-white/30 line-through leading-snug break-words">
                                  {task.title}
                                </h4>
                                {task.description && (
                                  <p className="text-xs text-white/20 line-through leading-relaxed break-words">
                                    {task.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <span className="flex items-center gap-1.5 bg-white/[0.02] border border-white/[0.05] px-2.5 py-1.5 rounded-lg text-xs text-white/50">
                                  {getCategoryIcon(task.category)}
                                  <span>{task.category}</span>
                                </span>
                                {task.completedDate && (
                                  <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/10 font-mono text-xs">
                                    ✓ Completed: {task.completedDate}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/[0.03]">
                                <button
                                  onClick={() => triggerRevertComplete(task.taskId)}
                                  className="h-11 flex items-center justify-center gap-1.5 rounded-xl font-bold text-xs bg-[#7C5CFF]/10 hover:bg-[#7C5CFF]/20 text-[#8D72FF] border border-[#7C5CFF]/25 cursor-pointer transition-all"
                                >
                                  <span>Restore</span>
                                </button>
                                <button
                                  onClick={() => triggerDeleteTask(task.taskId)}
                                  className="h-11 flex items-center justify-center gap-1.5 rounded-xl font-bold text-xs bg-white/[0.02] border border-white/[0.05] hover:bg-red-500/10 text-white/60 hover:text-red-400 cursor-pointer transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}

            {/* SWING SUB-VIEW: PROFILE */}
            {swingTab === 'profile' && (
              <div className="w-full max-w-2xl space-y-8 animate-fadeIn">
                <div className="border-b border-white/[0.03] pb-3">
                  <h1 className="text-xl font-bold tracking-tight text-white select-none">
                    Profile
                  </h1>
                </div>

                <div className="space-y-6">
                  {/* Profile Group */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider select-none font-mono">
                      Personal Information
                    </h3>
                    
                    <div className="border-t border-white/[0.05] divide-y divide-white/[0.05] text-xs">
                      {/* Avatar Row */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-white">Avatar Representation</span>
                          <p className="text-[11px] text-white/40">Derived automatically from your name.</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div 
                            className="w-[72px] h-[72px] rounded-full overflow-hidden shrink-0 border border-white/10 relative"
                          >
                            <div className="w-full h-full bg-gradient-to-br from-[#7C5CFF] to-indigo-600 flex items-center justify-center text-xl font-bold text-white uppercase select-none">
                              {getInitials(userProfileData?.name || userProfileData?.displayName || 'User')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Full Name Row */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-white">Full Name</span>
                          <p className="text-[11px] text-white/40">Used in dynamic greetings.</p>
                        </div>
                        <input
                          type="text"
                          value={userProfileData?.name || ''}
                          onChange={e => setUserProfileData(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full sm:w-72 bg-white/[0.015] border border-white/[0.05] rounded-xl sm:rounded-sm px-3.5 sm:px-2.5 h-12 sm:h-8 text-sm sm:text-xs text-white placeholder-white/20 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all"
                          placeholder="Mahammad Nihal"
                        />
                      </div>

                      {/* Email Row */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-white">Email Address</span>
                          <p className="text-[11px] text-white/40">Associated with your authenticated session.</p>
                        </div>
                        <input
                          type="email"
                          value={userProfileData?.email || ''}
                          readOnly
                          className="w-full sm:w-72 bg-white/[0.01] border border-white/[0.03] rounded-xl sm:rounded-sm px-3.5 sm:px-2.5 h-12 sm:h-8 text-sm sm:text-xs text-white/40 cursor-not-allowed focus:outline-none transition-all"
                          placeholder="user@example.com"
                        />
                      </div>

                      {/* Date of Birth Row */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-white">Date of Birth</span>
                          <p className="text-[11px] text-white/40">Your birthdate.</p>
                        </div>
                        <input
                          type="date"
                          value={userProfileData?.dob || ''}
                          onChange={e => setUserProfileData(prev => prev ? { ...prev, dob: e.target.value } : null)}
                          className="w-full sm:w-72 bg-white/[0.015] border border-white/[0.05] rounded-xl sm:rounded-sm px-3.5 sm:px-2.5 h-12 sm:h-8 text-sm sm:text-xs text-white focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all font-mono"
                        />
                      </div>

                      {/* Gender Row */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-white">Gender</span>
                          <p className="text-[11px] text-white/40">Your gender identity preference.</p>
                        </div>
                        <select
                          value={userProfileData?.gender || 'Unspecified'}
                          onChange={e => setUserProfileData(prev => prev ? { ...prev, gender: e.target.value } : null)}
                          className="w-full sm:w-72 bg-[#0D0D0E] border border-white/[0.05] rounded-xl sm:rounded-sm px-3.5 sm:px-2.5 h-12 sm:h-8 text-sm sm:text-xs text-white focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all cursor-pointer"
                        >
                          <option value="Unspecified" className="bg-[#0D0D0E]">Prefer not to say</option>
                          <option value="Male" className="bg-[#0D0D0E]">Male</option>
                          <option value="Female" className="bg-[#0D0D0E]">Female</option>
                          <option value="Non-Binary" className="bg-[#0D0D0E]">Non-Binary</option>
                        </select>
                      </div>

                      {/* Country Row */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-white">Country</span>
                          <p className="text-[11px] text-white/40">Localization region.</p>
                        </div>
                        <SearchableCountrySelector
                          value={userProfileData?.country || ''}
                          onChange={countryName => setUserProfileData(prev => prev ? { ...prev, country: countryName } : null)}
                        />
                      </div>

                      {/* Timezone Row */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-white">Timezone</span>
                          <p className="text-[11px] text-white/40">For due date calculations.</p>
                        </div>
                        <SearchableTimezoneSelector
                          value={userProfileData?.timezone || 'UTC'}
                          onChange={tz => setUserProfileData(prev => prev ? { ...prev, timezone: tz } : null)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Trigger */}
                  <div className="flex justify-end pt-4 border-t border-white/[0.05]">
                    <button
                      onClick={async () => {
                        if (!currentUser || !userProfileData) return;
                        try {
                          const currentProf = await taskService.current!.loadProfile(currentUser.uid) || {};
                          const updatedProf = {
                            ...currentProf,
                            uid: currentUser.uid,
                            photoURL: '',
                            name: userProfileData.name,
                            email: userProfileData.email,
                            dob: userProfileData.dob || '',
                            gender: userProfileData.gender || 'Unspecified',
                            country: userProfileData.country || 'India',
                            timezone: userProfileData.timezone || 'UTC',
                            updatedAt: new Date().toISOString()
                          };
                          await taskService.current!.saveProfile(currentUser.uid, updatedProf);
                          setUserProfileData(updatedProf);
                          addToast('Profile updated successfully', 'success');
                        } catch (err) {
                          addToast('Failed to save profile', 'error');
                        }
                      }}
                      className="w-full sm:w-auto h-12 sm:h-8 bg-[#7C5CFF] hover:bg-[#8D72FF] text-white text-sm sm:text-[11px] font-semibold px-5 rounded-xl sm:rounded cursor-pointer transition-colors"
                    >
                      Save Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SWING SUB-VIEW: SETTINGS */}
            {swingTab === 'settings' && (
              <div className="w-full max-w-2xl space-y-8 animate-fadeIn">
                <div className="border-b border-white/[0.03] pb-3">
                  <h1 className="text-xl font-bold tracking-tight text-white select-none">
                    Settings
                  </h1>
                </div>

                <div className="space-y-6">
                  {/* Preferences Group */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider select-none font-mono">
                      Visual Preferences
                    </h3>
                    
                    <div className="border-t border-white/[0.05] divide-y divide-white/[0.05] text-xs">
                      {/* Theme Row */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-white">Theme</span>
                          <p className="text-[11px] text-white/40">Visual theme options.</p>
                        </div>
                        <select
                          value={userProfileData?.theme || 'dark'}
                          onChange={e => setUserProfileData(prev => prev ? { ...prev, theme: e.target.value } : null)}
                          className="w-full sm:w-72 bg-[#0D0D0E] border border-white/[0.05] rounded-xl sm:rounded-sm px-3.5 sm:px-2.5 h-12 sm:h-8 text-sm sm:text-xs text-white focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all cursor-pointer"
                        >
                          <option value="dark" className="bg-[#0D0D0E]">Dark</option>
                          <option value="light" className="bg-[#0D0D0E]">Midnight Minimal Gray</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Future Application Preferences Group */}
                  <div className="space-y-4 pt-4 border-t border-white/[0.05]">
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider select-none font-mono">
                        Future Preferences
                      </h3>
                      <p className="text-[11px] text-white/40">
                        Configure advanced productivity layouts.
                      </p>
                    </div>

                    <div className="border-t border-white/[0.05] divide-y divide-white/[0.05] text-xs">
                      {/* First Day of Week */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-white">First Day of Week</span>
                          <p className="text-[11px] text-white/40">Choose which day starts your weekly calendar.</p>
                        </div>
                        <select
                          value={userProfileData?.firstDayOfWeek || 'Monday'}
                          onChange={e => setUserProfileData(prev => prev ? { ...prev, firstDayOfWeek: e.target.value } : null)}
                          className="w-full sm:w-72 bg-[#0D0D0E] border border-white/[0.05] rounded-xl sm:rounded-sm px-3.5 sm:px-2.5 h-12 sm:h-8 text-sm sm:text-xs text-white focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all cursor-pointer"
                        >
                          <option value="Sunday" className="bg-[#0D0D0E]">Sunday</option>
                          <option value="Monday" className="bg-[#0D0D0E]">Monday</option>
                        </select>
                      </div>

                      {/* Daily Digest preference */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-white">Daily Digest Summaries</span>
                          <p className="text-[11px] text-white/40">Generate interactive offline performance reports each morning.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={userProfileData?.enableDailyDigest ?? true}
                            onChange={e => setUserProfileData(prev => prev ? { ...prev, enableDailyDigest: e.target.checked } : null)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white/60 peer-checked:after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#7C5CFF]" />
                        </label>
                      </div>

                      {/* Compact Task List preference */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
                        <div className="space-y-1">
                          <span className="font-semibold text-white">Compact Mode</span>
                          <p className="text-[11px] text-white/40">Densely packs the task list rows for maximum data density.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={userProfileData?.compactMode ?? false}
                            onChange={e => setUserProfileData(prev => prev ? { ...prev, compactMode: e.target.checked } : null)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white/60 peer-checked:after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#7C5CFF]" />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Reminder timings Group */}
                  <div className="space-y-4 pt-4 border-t border-white/[0.05]">
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider select-none font-mono">
                        System Notifications & Reminder Timings
                      </h3>
                      <p className="text-[11px] text-white/40">
                        Configure desktop deadline reminder schedules.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {[
                        { key: 'minutesBefore30', label: '30 Minutes Before' },
                        { key: 'minutesBefore15', label: '15 Minutes Before' },
                        { key: 'minutesBefore5', label: '5 Minutes Before' },
                        { key: 'atDeadline', label: 'At Deadline' }
                      ].map(pref => {
                        const isChecked = !!userProfileData?.notificationPrefs?.[pref.key as keyof typeof userProfileData.notificationPrefs];
                        return (
                          <label key={pref.key} className="flex items-center gap-2.5 bg-white/[0.015] border border-white/[0.05] hover:bg-white/[0.03] p-4 sm:p-3 rounded-xl sm:rounded cursor-pointer transition-all select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                setUserProfileData(prev => {
                                  if (!prev) return null;
                                  const notificationPrefs = {
                                    minutesBefore30: true,
                                    minutesBefore15: true,
                                    minutesBefore5: true,
                                    atDeadline: true,
                                    ...prev.notificationPrefs,
                                    [pref.key]: e.target.checked
                                  };
                                  return { ...prev, notificationPrefs };
                                });
                              }}
                              className="w-4 h-4 accent-[#7C5CFF] rounded cursor-pointer shrink-0"
                            />
                            <span className="text-sm sm:text-xs font-medium text-white/60">{pref.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save Trigger */}
                  <div className="flex justify-end pt-4 border-t border-white/[0.05]">
                    <button
                      onClick={async () => {
                        if (!currentUser || !userProfileData) return;
                        try {
                          const currentProf = await taskService.current!.loadProfile(currentUser.uid) || {};
                          const updatedProf = {
                            ...currentProf,
                            theme: userProfileData.theme,
                            notificationPrefs: userProfileData.notificationPrefs,
                            firstDayOfWeek: userProfileData.firstDayOfWeek,
                            enableDailyDigest: userProfileData.enableDailyDigest,
                            compactMode: userProfileData.compactMode,
                            updatedAt: new Date().toISOString()
                          };
                          await taskService.current!.saveProfile(currentUser.uid, updatedProf);
                          setUserProfileData(updatedProf);
                          addToast('Settings saved successfully', 'success');
                        } catch (err) {
                          addToast('Failed to save settings', 'error');
                        }
                      }}
                      className="w-full sm:w-auto h-12 sm:h-8 bg-[#7C5CFF] hover:bg-[#8D72FF] text-white text-sm sm:text-[11px] font-semibold px-5 rounded-xl sm:rounded cursor-pointer transition-colors"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

                {/* SWING SUB-VIEW: INSIGHTS */}
            {swingTab === 'insights' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-white/[0.04] pb-3">
                  <h2 className="text-lg font-bold text-white tracking-tight select-none">
                    Productivity Insights & Metrics
                  </h2>
                </div>

                {/* Grid 1: Streaks Bento Box */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/[0.015] border border-white/[0.04] p-4 rounded flex flex-col justify-between transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/30 tracking-wider uppercase select-none">Daily Streak</span>
                      <Flame className="w-4 h-4 text-orange-500/80" />
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-white leading-none">
                        {smartStats.currentDailyStreak}
                      </span>
                      <span className="text-[9px] font-medium text-white/30 ml-1 select-none">days</span>
                    </div>
                  </div>

                  <div className="bg-white/[0.015] border border-white/[0.04] p-4 rounded flex flex-col justify-between transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/30 tracking-wider uppercase select-none">Best Streak</span>
                      <Award className="w-4 h-4 text-yellow-500/80" />
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-white leading-none">
                        {smartStats.bestDailyStreak}
                      </span>
                      <span className="text-[9px] font-medium text-white/30 ml-1 select-none">days max</span>
                    </div>
                  </div>

                  <div className="bg-white/[0.015] border border-white/[0.04] p-4 rounded flex flex-col justify-between transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/30 tracking-wider uppercase select-none">Weekly Streak</span>
                      <Sparkles className="w-4 h-4 text-[#7C5CFF]" />
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-white leading-none">
                        {smartStats.weeklyStreak}
                      </span>
                      <span className="text-[9px] font-medium text-white/30 ml-1 select-none">weeks</span>
                    </div>
                  </div>

                  <div className="bg-white/[0.015] border border-white/[0.04] p-4 rounded flex flex-col justify-between transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/30 tracking-wider uppercase select-none">Monthly Streak</span>
                      <CalendarDays className="w-4 h-4 text-emerald-400/80" />
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-white leading-none">
                        {smartStats.monthlyStreak}
                      </span>
                      <span className="text-[9px] font-medium text-white/30 ml-1 select-none">months</span>
                    </div>
                  </div>
                </div>

                {/* Grid 2: Today's Progress Card */}
                <div className="bg-white/[0.015] border border-white/[0.04] p-4 rounded space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Today's Progress</span>
                    <span className="text-[11px] font-semibold font-mono text-white/40">
                      {smartStats.todayProgress.completed} / {smartStats.todayProgress.total} ({smartStats.todayProgress.total > 0 ? Math.round((smartStats.todayProgress.completed / smartStats.todayProgress.total) * 100) : 0}%)
                    </span>
                  </div>
                  
                  <div className="border-t border-white/[0.03] pt-3.5">
                    <div className="h-1.5 w-full bg-white/[0.01] rounded-full overflow-hidden border border-white/[0.03]">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-[#7C5CFF] rounded-full transition-all duration-500"
                        style={{ width: `${smartStats.todayProgress.total > 0 ? (smartStats.todayProgress.completed / smartStats.todayProgress.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {smartStats.todayProgress.total === 0 && (
                    <div className="text-xs text-white/30 font-mono select-none pt-1">
                      No tasks scheduled for today.
                    </div>
                  )}
                </div>

                {/* Split layout: Graph left, Calendar + Logger right */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left columns (Graph) */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white/[0.015] border border-white/[0.04] p-5 rounded space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-[#7C5CFF]" />
                          <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Completion Trend %</span>
                        </div>
                        
                        {/* Range Selector Controls */}
                        <div className="flex items-center gap-1 bg-white/[0.01] border border-white/[0.03] p-1 sm:p-0.5 rounded-xl sm:rounded-sm text-xs sm:text-[10px] font-semibold text-white/50 w-full sm:w-auto">
                          {(['7', '30', 'custom'] as const).map(mode => (
                            <button
                              key={mode}
                              onClick={() => setGraphRange(mode)}
                              className={`h-10 sm:h-auto flex-1 sm:flex-none flex items-center justify-center px-3.5 sm:px-2.5 py-1 rounded-lg sm:rounded-sm cursor-pointer transition-colors ${
                                graphRange === mode ? 'bg-[#7C5CFF]/15 text-[#7C5CFF] font-bold' : 'hover:text-white'
                              }`}
                            >
                              {mode === '7' ? '7 Days' : mode === '30' ? '30 Days' : 'Custom'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Date Pickers */}
                      {graphRange === 'custom' && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-transparent border border-white/[0.03] p-3 sm:p-2 rounded-xl sm:rounded-sm text-xs sm:text-[11px] animate-fadeIn">
                          <div className="flex items-center gap-2 flex-1 w-full">
                            <span className="text-white/40 shrink-0">Start:</span>
                            <input 
                              type="date"
                              value={customStartDate}
                              onChange={e => setGraphRange(e.target.value)}
                              className="bg-[#0D0D0E] text-white border border-white/[0.03] px-3 py-2 rounded-lg sm:rounded-sm text-xs sm:text-[10px] h-11 sm:h-auto focus:outline-none focus:border-white/10 flex-1 w-full"
                            />
                          </div>
                          <div className="flex items-center gap-2 flex-1 w-full">
                            <span className="text-white/40 shrink-0">End:</span>
                            <input 
                              type="date"
                              value={customEndDate}
                              onChange={e => setGraphRange(e.target.value)}
                              className="bg-[#0D0D0E] text-white border border-white/[0.03] px-3 py-2 rounded-lg sm:rounded-sm text-xs sm:text-[10px] h-11 sm:h-auto focus:outline-none focus:border-white/10 flex-1 w-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* Chart Container */}
                      <div className="h-[200px] w-full text-xs">
                        {graphData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={graphData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.02)" />
                              <XAxis 
                                dataKey="date" 
                                stroke="#3F3F46" 
                                tickLine={false} 
                                axisLine={false}
                                dy={8}
                                style={{ fontSize: '9px', fontFamily: 'monospace' }}
                              />
                              <YAxis 
                                domain={[0, 100]} 
                                stroke="#3F3F46" 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={v => `${v}%`}
                                style={{ fontSize: '9px', fontFamily: 'monospace' }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#09090A', 
                                  borderColor: 'rgba(255, 255, 255, 0.03)',
                                  borderRadius: '4px',
                                  color: '#fff',
                                  fontFamily: 'monospace',
                                  fontSize: '11px'
                                }}
                                formatter={(value: any, name: any, props: any) => {
                                  const { total, completed } = props.payload;
                                  return [
                                    `Completion: ${value}% (${completed}/${total} tasks)`,
                                    undefined
                                  ];
                                }}
                                labelStyle={{ color: '#71717A', fontWeight: 'bold' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="percentage" 
                                stroke="#7C5CFF" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorCompletion)" 
                                activeDot={{ r: 4, stroke: '#000', strokeWidth: 1.5 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-[#71717A] select-none font-mono">
                            No metrics available in this range.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Calendar and Logger) */}
                  <div className="space-y-4">
                    <CalendarView
                      tasks={tasks}
                      selectedDate={selectedCalendarDate}
                      onSelectDate={setSelectedCalendarDate}
                      onAddTaskForDate={handleAddTaskForDate}
                    />

                    {/* Compact terminal log */}
                    <div className="bg-white/[0.015] border border-white/[0.04] rounded p-4 space-y-3 font-mono">
                      <div className="flex items-center justify-between text-[9px] text-white/30 select-none uppercase tracking-wider pb-2 border-b border-white/[0.03]">
                        <span>Local Storage Trail</span>
                        <span className="text-[#7C5CFF]">Ready</span>
                      </div>
                      <div className="h-28 overflow-y-auto text-[10px] text-white/40 space-y-1.5 scrollbar-none">
                        {terminalLogs.slice().reverse().map((log, idx) => (
                          <div key={idx} className="leading-normal break-all">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>



      {/* TOAST OVERLAY */}
      <div className="fixed bottom-6 right-6 left-6 sm:left-auto z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              className={`p-4 rounded-xl border shadow-lg backdrop-blur-md flex items-center justify-between gap-3 pointer-events-auto ${
                toast.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-200'
                  : toast.type === 'info'
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-200'
                    : 'bg-[#7C5CFF]/10 border-[#7C5CFF]/20 text-[#D8CFFF]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-current animate-pulse shrink-0" />
                <span className="text-xs font-semibold font-mono truncate">{toast.message}</span>
              </div>
              {toast.showUndo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUndo();
                    setToasts(prev => prev.filter(t => t.id !== toast.id));
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold text-[#9D85FF] hover:text-white bg-white/[0.04] hover:bg-[#7C5CFF]/20 rounded-lg border border-[#7C5CFF]/30 cursor-pointer transition-all active:scale-95 shrink-0"
                >
                  Undo
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* MODAL: ADD TASK */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-[#0D0D0E] border border-white/[0.03] rounded p-6 w-full max-w-md shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-white/[0.03] pb-3">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Create New Task</h3>
                <button onClick={() => setShowAddModal(false)} className="text-[#A1A1AA] hover:text-white cursor-pointer text-xs">✕</button>
              </div>

              <form onSubmit={handleAddTaskSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-white/30 uppercase tracking-wider block">Task Title</label>
                  <input
                    type="text"
                    required
                    value={addTitle}
                    onChange={e => setAddTitle(e.target.value)}
                    className="w-full bg-transparent border border-white/[0.02] focus:border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                    placeholder="Enter task name..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-white/30 uppercase tracking-wider block">Description</label>
                  <textarea
                    value={addDesc}
                    onChange={e => setAddDesc(e.target.value)}
                    className="w-full bg-transparent border border-white/[0.02] focus:border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none h-20 resize-none"
                    placeholder="Provide details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-white/30 uppercase tracking-wider block">Priority</label>
                    <select
                      value={addPriority}
                      onChange={e => setAddPriority(parseInt(e.target.value))}
                      className="w-full bg-transparent border border-white/[0.02] focus:border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value={1} className="bg-[#0D0D0E]">Low</option>
                      <option value={2} className="bg-[#0D0D0E]">Medium</option>
                      <option value={3} className="bg-[#0D0D0E]">High</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-white/30 uppercase tracking-wider block">Category</label>
                    <input
                      type="text"
                      value={addCategory}
                      onChange={e => setAddCategory(e.target.value)}
                      className="w-full bg-transparent border border-white/[0.02] focus:border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-white/30 uppercase tracking-wider block">Due Date</label>
                    <input
                      type="date"
                      required
                      value={addDueDate}
                      onChange={e => setAddDueDate(e.target.value)}
                      className="w-full bg-transparent border border-white/[0.02] focus:border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-white/30 uppercase tracking-wider block">Due Time</label>
                    <input
                      type="time"
                      required
                      value={addDueTime}
                      onChange={e => setAddDueTime(e.target.value)}
                      className="w-full bg-transparent border border-white/[0.02] focus:border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.02]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-transparent hover:bg-white/[0.01] text-white/60 hover:text-white text-[11px] font-semibold px-4 py-1.5 rounded cursor-pointer border border-white/[0.02]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#7C5CFF] hover:bg-[#8D72FF] text-white text-[11px] font-semibold px-4 py-1.5 rounded cursor-pointer transition-colors"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT TASK */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-[#0D0D0E] border border-white/[0.03] rounded p-6 w-full max-w-md shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-white/[0.03] pb-3">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Edit Task</h3>
                <button onClick={() => setShowEditModal(null)} className="text-[#A1A1AA] hover:text-white cursor-pointer text-xs">✕</button>
              </div>

              <form onSubmit={handleEditTaskSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-white/30 uppercase tracking-wider block">Task Title</label>
                  <input
                    type="text"
                    required
                    value={showEditModal.title}
                    onChange={e => setShowEditModal({ ...showEditModal, title: e.target.value })}
                    className="w-full bg-transparent border border-white/[0.02] focus:border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-white/30 uppercase tracking-wider block">Description</label>
                  <textarea
                    value={showEditModal.description}
                    onChange={e => setShowEditModal({ ...showEditModal, description: e.target.value })}
                    className="w-full bg-transparent border border-white/[0.02] focus:border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none h-20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-white/30 uppercase tracking-wider block">Priority</label>
                    <select
                      value={showEditModal.priority}
                      onChange={e => setShowEditModal({ ...showEditModal, priority: parseInt(e.target.value) })}
                      className="w-full bg-transparent border border-white/[0.02] focus:border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value={1} className="bg-[#0D0D0E]">Low</option>
                      <option value={2} className="bg-[#0D0D0E]">Medium</option>
                      <option value={3} className="bg-[#0D0D0E]">High</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-white/30 uppercase tracking-wider block">Category</label>
                    <input
                      type="text"
                      value={showEditModal.category}
                      onChange={e => setShowEditModal({ ...showEditModal, category: e.target.value })}
                      className="w-full bg-transparent border border-white/[0.02] focus:border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-semibold text-white/30 uppercase tracking-wider block">Due Date</label>
                    <input
                      type="date"
                      required
                      value={showEditModal.dueDate}
                      onChange={e => setShowEditModal({ ...showEditModal, dueDate: e.target.value })}
                      className="w-full bg-transparent border border-white/[0.02] focus:border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-semibold text-white/30 uppercase tracking-wider block">Due Time</label>
                    <input
                      type="time"
                      required
                      value={showEditModal.dueTime || '12:00'}
                      onChange={e => setShowEditModal({ ...showEditModal, dueTime: e.target.value })}
                      className="w-full bg-transparent border border-white/[0.02] focus:border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-semibold text-white/30 uppercase tracking-wider block">Status</label>
                    <select
                      value={showEditModal.status}
                      onChange={e => setShowEditModal({ ...showEditModal, status: e.target.value as any })}
                      className="w-full bg-transparent border border-white/[0.02] focus:border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Pending" className="bg-[#0D0D0E]">Pending</option>
                      <option value="Completed" className="bg-[#0D0D0E]">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.02]">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(null)}
                    className="bg-transparent hover:bg-white/[0.01] text-white/60 hover:text-white text-[11px] font-semibold px-4 py-1.5 rounded cursor-pointer border border-white/[0.02]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#7C5CFF] hover:bg-[#8D72FF] text-white text-[11px] font-semibold px-4 py-1.5 rounded cursor-pointer transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
