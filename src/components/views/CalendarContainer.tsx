import { CalendarNavigation } from '../calendar/CalendarNavigation';
import { UnscheduledSidebar } from './UnscheduledSidebar';
import { MonthlyView } from './MonthlyView';
import { WeeklyView } from './WeeklyView';
import { DailyView } from './DailyView';
import { getUnscheduledTasks } from '../../lib/calendarUtils';
import type { Task, ViewMode, TaskStatus, Category } from '../../lib/types';

interface CalendarContainerProps {
  viewMode: Exclude<ViewMode, 'grid'>;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  tasks: Task[];
  categories: Category[];
  onTaskSelect: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export function CalendarContainer({
  viewMode,
  currentDate,
  onDateChange,
  tasks,
  categories,
  onTaskSelect,
  onUpdateTask,
}: CalendarContainerProps) {
  // Get unscheduled tasks (no dueDate)
  const unscheduledTasks = getUnscheduledTasks(tasks);

  // Cycle task status helper
  const handleStatusCycle = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const statusOrder: TaskStatus[] = ['not_started', 'in_progress', 'completed'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % 3];

    onUpdateTask(taskId, { status: nextStatus });
  };

  // Render the appropriate view
  const renderView = () => {
    const commonProps = {
      currentDate,
      tasks,
      onTaskSelect,
      onStatusCycle: handleStatusCycle,
      onDateChange,
      onUpdateTask,
    };

    switch (viewMode) {
      case 'monthly':
        return <MonthlyView {...commonProps} />;
      case 'weekly':
        return <WeeklyView {...commonProps} categories={categories} />;
      case 'daily':
        return <DailyView {...commonProps} categories={categories} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Navigation header */}
      <CalendarNavigation
        viewMode={viewMode}
        currentDate={currentDate}
        onDateChange={onDateChange}
      />

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Calendar view */}
        <div className="flex-1 overflow-auto bg-white">
          {renderView()}
        </div>

        {/* Unscheduled tasks sidebar */}
        <UnscheduledSidebar
          tasks={unscheduledTasks}
          onTaskSelect={onTaskSelect}
          onStatusCycle={handleStatusCycle}
        />
      </div>
    </div>
  );
}
