import { useEffect } from "react";

interface KeyboardShortcutsProps {
  onSearchFocus?: () => void;
  onClearSearch?: () => void;
}

export function useKeyboardShortcuts({ onSearchFocus, onClearSearch }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        onSearchFocus?.();
      }

      // Escape to clear search
      if (event.key === 'Escape') {
        onClearSearch?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSearchFocus, onClearSearch]);
}
