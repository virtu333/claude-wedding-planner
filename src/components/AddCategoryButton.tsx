import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface AddCategoryButtonProps {
  colSpan: number;
  onAdd: (name: string) => void;
}

export function AddCategoryButton({ colSpan, onAdd }: AddCategoryButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

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
    <tr>
      <td
        colSpan={colSpan}
        className="border border-[#637569]/30 bg-[#637569]/5 px-4 py-2"
      >
        {isAdding ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              placeholder="Category name"
              className="px-2 py-1 text-sm border border-[#29564F] rounded outline-none focus:ring-2 focus:ring-[#29564F]/30"
            />
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-sm text-[#637569] hover:text-[#29564F]"
          >
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        )}
      </td>
    </tr>
  );
}
