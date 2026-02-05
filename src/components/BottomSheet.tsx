import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Optional footer content (e.g., delete button) */
  footer?: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children, footer }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState(0);

  // Update visibility when isOpen changes
  // When opening: show immediately
  // When closing: keep visible until animation completes
  if (isOpen && !isVisible) {
    setIsVisible(true);
  }

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Touch handlers for swipe-to-close (only on the drag handle area)
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null) return;
    const diff = e.touches[0].clientY - startY;
    // Only allow downward swipe
    if (diff > 0) {
      setCurrentY(diff);
    }
  };

  const handleTouchEnd = () => {
    // If swiped more than 100px, close the sheet
    if (currentY > 100) {
      onClose();
    }
    setStartY(null);
    setCurrentY(0);
  };

  // Handle transition end - hide when close animation completes
  const handleTransitionEnd = () => {
    if (!isOpen) {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTransitionEnd={handleTransitionEnd}
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl',
          'max-h-[90vh] flex flex-col transition-transform duration-300 ease-out'
        )}
        style={{
          transform: isOpen
            ? currentY > 0
              ? `translateY(${currentY}px)`
              : 'translateY(0)'
            : 'translateY(100%)',
        }}
      >
        {/* Drag handle - swipe area */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
        >
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b">
            <h2 className="font-medium text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 -m-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t bg-gray-50 safe-bottom">{footer}</div>
        )}
      </div>
    </div>
  );
}
