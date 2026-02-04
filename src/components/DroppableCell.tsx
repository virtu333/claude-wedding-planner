import { useDroppable } from '@dnd-kit/core';
import { cn } from '../lib/utils';

interface DroppableCellProps {
  categoryId: string;
  timeframeId: string;
  children: React.ReactNode;
}

export function DroppableCell({ categoryId, timeframeId, children }: DroppableCellProps) {
  // Create a unique droppable ID as "categoryId:timeframeId"
  const droppableId = `${categoryId}:${timeframeId}`;

  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
  });

  return (
    <td
      ref={setNodeRef}
      className={cn(
        'border border-gray-200 px-3 py-2 align-top min-w-[180px] transition-colors',
        isOver ? 'bg-[#29564F]/10 border-[#29564F]/50' : 'bg-white'
      )}
    >
      {children}
    </td>
  );
}
