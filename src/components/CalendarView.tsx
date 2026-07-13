import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { Task } from '../types';

interface CalendarViewProps {
  tasks: Task[];
  selectedDate: string | null; // format: YYYY-MM-DD
  onSelectDate: (date: string | null) => void;
  onAddTaskForDate: (date: string) => void;
}

export function CalendarView({ tasks, selectedDate, onSelectDate, onAddTaskForDate }: CalendarViewProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to parse DD/MM/YYYY to a Date object or standard date string
  const parseTaskDate = (dStr: string) => {
    const parts = dStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dStr; // already YYYY-MM-DD
  };

  // Helper to get task count & details for a specific YYYY-MM-DD date
  const getTasksForDate = (dateStr: string) => {
    return tasks.filter(t => t.status !== 'Completed' && parseTaskDate(t.dueDate) === dateStr);
  };

  // Get days in a month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of the month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    onSelectDate(todayStr);
  };

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Build the calendar matrix
  const calendarCells = [];
  // Empty slots for preceding month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  // Month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  return (
    <div className="bg-white/[0.015] border border-white/[0.04] rounded p-4 shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5 text-white/40" />
          <h3 className="text-xs font-semibold text-white tracking-tight">
            {months[currentMonth]} {currentYear}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleToday}
            className="text-[10px] font-semibold text-white/50 hover:text-white bg-white/[0.015] border border-white/[0.04] px-2.5 py-1 rounded-sm cursor-pointer transition-colors mr-1"
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-1 text-white/40 hover:text-white hover:bg-white/[0.03] border border-white/[0.04] rounded-sm cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 text-white/40 hover:text-white hover:bg-white/[0.03] border border-white/[0.04] rounded-sm cursor-pointer transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Week days labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {daysOfWeek.map((day, idx) => (
          <span key={idx} className="text-[10px] font-bold text-white/30 tracking-wider uppercase select-none py-1">
            {day}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isCellToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
          const isSelected = selectedDate === cellDateStr;
          
          const dateTasks = getTasksForDate(cellDateStr);
          const hasTasks = dateTasks.length > 0;

          // Priority indicator dots
          const highTasks = dateTasks.filter(t => t.priority === 3);
          const medTasks = dateTasks.filter(t => t.priority === 2);
          const lowTasks = dateTasks.filter(t => t.priority === 1);

          return (
            <button
              key={day}
              onClick={() => onSelectDate(isSelected ? null : cellDateStr)}
              className={`aspect-square relative flex flex-col items-center justify-center rounded-sm text-xs font-semibold cursor-pointer transition-all duration-150 select-none ${
                isSelected
                  ? 'bg-[#7C5CFF] text-white'
                  : isCellToday
                    ? 'border border-[#7C5CFF]/30 text-[#7C5CFF] bg-[#7C5CFF]/5 hover:bg-white/[0.03]'
                    : 'text-white/80 hover:bg-white/[0.03]'
              }`}
            >
              <span className="leading-none">{day}</span>
              
              {/* Custom indicators */}
              {hasTasks && !isSelected && (
                <div className="absolute bottom-1.5 flex items-center justify-center gap-0.5">
                  {highTasks.length > 0 && <span className="w-1 h-1 rounded-full bg-red-400" />}
                  {medTasks.length > 0 && <span className="w-1 h-1 rounded-full bg-amber-400" />}
                  {lowTasks.length > 0 && <span className="w-1 h-1 rounded-full bg-green-400" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Info & Action Footer */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-3 border-t border-white/[0.03] flex items-center justify-between text-[11px]"
        >
          <div className="flex items-center gap-2">
            <span className="text-white/40">
              {getTasksForDate(selectedDate).length} pending task(s)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onAddTaskForDate(selectedDate)}
              className="text-[#7C5CFF] hover:text-white font-semibold cursor-pointer transition-colors"
            >
              + Create task
            </button>
            <span className="text-white/[0.1]">•</span>
            <button
              onClick={() => onSelectDate(null)}
              className="text-white/30 hover:text-white/50 cursor-pointer transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Clear
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
