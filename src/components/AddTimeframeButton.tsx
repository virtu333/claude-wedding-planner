import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { Timeframe } from '../lib/types';

interface AddTimeframeButtonProps {
  timeframes: Timeframe[];
  onAdd: (name: string) => void;
}

export function AddTimeframeButton({ timeframes, onAdd }: AddTimeframeButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate suggested name based on last timeframe
  const getSuggestedName = (): string => {
    if (timeframes.length === 0) {
      const now = new Date();
      return now.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    }

    // Try to parse the last timeframe name as a date
    const lastTimeframe = [...timeframes].sort((a, b) => b.order - a.order)[0];
    const lastDate = new Date(lastTimeframe.name);

    if (!isNaN(lastDate.getTime())) {
      // Add one month to the last date
      lastDate.setMonth(lastDate.getMonth() + 1);
      return lastDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    }

    // If can't parse, just return empty string
    return '';
  };

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isAdding]);

  const handleStartAdd = () => {
    setNewName(getSuggestedName());
    setIsAdding(true);
  };

  const handleSave = () => {
    const trimmed = newName.trim();
    if (trimmed) {
      onAdd(trimmed);
    }
    setNewName('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <th className="bg-[#E8EDEB] border border-[#637569]/30 px-2 py-3 min-w-[50px]">
      {isAdding ? (
        <input
          ref={inputRef}
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder="New timeframe"
          className="w-24 px-2 py-1 text-sm border border-[#29564F] rounded outline-none focus:ring-2 focus:ring-[#29564F]/30"
        />
      ) : (
        <button
          onClick={handleStartAdd}
          aria-label="Add timeframe"
          className="p-1 rounded text-[#637569] hover:text-[#29564F] hover:bg-[#637569]/10"
        >
          <Plus size={18} />
        </button>
      )}
    </th>
  );
}
