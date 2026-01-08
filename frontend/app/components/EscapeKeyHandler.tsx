'use client';

import { useEffect } from 'react';
import { useTodoActions } from '../contexts/TodoActionsContext';

export default function EscapeKeyHandler() {
  const { closeDrawer } = useTodoActions();

  // Close all drawers on page load to prevent blank drawers after reload
  useEffect(() => {
    const todoActionsCheckbox = document.getElementById('todoActionsDrawer') as HTMLInputElement;
    const mainMenuCheckbox = document.getElementById('mainMenu') as HTMLInputElement;
    
    if (todoActionsCheckbox) {
      todoActionsCheckbox.checked = false;
    }
    if (mainMenuCheckbox) {
      mainMenuCheckbox.checked = false;
    }
  }, []); // Run once on mount

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Check if todo actions drawer is open (left drawer)
        const todoActionsCheckbox = document.getElementById('todoActionsDrawer') as HTMLInputElement;
        const isTodoActionsOpen = todoActionsCheckbox?.checked;

        // Check if main menu is open (right drawer)
        const mainMenuCheckbox = document.getElementById('mainMenu') as HTMLInputElement;
        const isMainMenuOpen = mainMenuCheckbox?.checked;

        // Close whichever drawer is open
        if (isTodoActionsOpen) {
          closeDrawer();
        } else if (isMainMenuOpen) {
          mainMenuCheckbox.checked = false;
        }
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleEscape);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeDrawer]);

  // This component doesn't render anything
  return null;
}

