import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  formatMonthYear,
  formatWeekRange,
  formatDayHeader,
  addMonths,
  addWeeks,
  addDays,
} from '../../lib/calendarUtils';
import type { ViewMode } from '../../lib/types';

interface CalendarNavigationProps {
  viewMode: Exclude<ViewMode, 'grid'>;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function CalendarNavigation({
  viewMode,
  currentDate,
  onDateChange,
}: CalendarNavigationProps) {
  // Format the display based on view mode
  const getDateDisplay = () => {
    switch (viewMode) {
      case 'monthly':
        return formatMonthYear(currentDate);
      case 'weekly':
        return formatWeekRange(currentDate);
      case 'daily':
        return formatDayHeader(currentDate);
    }
  };

  // Navigate prev/next based on view mode
  const handlePrev = () => {
    switch (viewMode) {
      case 'monthly':
        onDateChange(addMonths(currentDate, -1));
        break;
      case 'weekly':
        onDateChange(addWeeks(currentDate, -1));
        break;
      case 'daily':
        onDateChange(addDays(currentDate, -1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case 'monthly':
        onDateChange(addMonths(currentDate, 1));
        break;
      case 'weekly':
        onDateChange(addWeeks(currentDate, 1));
        break;
      case 'daily':
        onDateChange(addDays(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#637569]/30 bg-[#DFE5E2]">
      {/* Prev/Next buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrev}
          className="p-1.5 rounded hover:bg-[#29564F]/10 text-[#29564F] transition-colors"
          title="Previous"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={handleNext}
          className="p-1.5 rounded hover:bg-[#29564F]/10 text-[#29564F] transition-colors"
          title="Next"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Date display */}
      <h2 className="text-lg font-semibold text-[#29564F] min-w-[200px]">
        {getDateDisplay()}
      </h2>

      {/* Today button */}
      <button
        onClick={handleToday}
        className={cn(
          'px-3 py-1 text-sm rounded-md transition-colors',
          'border border-[#29564F] text-[#29564F] hover:bg-[#29564F]/10'
        )}
      >
        Today
      </button>
    </div>
  );
}
