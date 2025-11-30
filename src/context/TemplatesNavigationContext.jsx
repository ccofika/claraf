import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const TemplatesNavigationContext = createContext();

export const useTemplatesNavigation = () => {
  const context = useContext(TemplatesNavigationContext);
  if (!context) {
    throw new Error('useTemplatesNavigation must be used within TemplatesNavigationProvider');
  }
  return context;
};

export const TemplatesNavigationProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [createElementsCallback, setCreateElementsCallback] = useState(null);
  const [viewportInfo, setViewportInfo] = useState(null);
  const { user } = useAuth();

  const openTemplates = useCallback(() => {
    if (user && isEditMode) {
      setIsOpen(true);
    }
  }, [user, isEditMode]);

  const closeTemplates = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleTemplates = useCallback(() => {
    if (user && isEditMode) {
      setIsOpen(prev => !prev);
    }
  }, [user, isEditMode]);

  // Set edit mode from workspace
  const setEditModeState = useCallback((editMode) => {
    setIsEditMode(editMode);
  }, []);

  // Set the element creation callback from workspace
  const setElementCreator = useCallback((callback) => {
    setCreateElementsCallback(() => callback);
  }, []);

  // Set viewport info for calculating element positions
  const setViewport = useCallback((viewport) => {
    setViewportInfo(viewport);
  }, []);

  // Create elements from template
  const createFromTemplate = useCallback(async (templateElements) => {
    if (createElementsCallback && templateElements.length > 0) {
      const createdElements = [];
      for (const element of templateElements) {
        const created = await createElementsCallback(element);
        if (created) {
          createdElements.push(created);
        }
      }
      return createdElements;
    }
    return [];
  }, [createElementsCallback]);

  // Global keyboard shortcut: Alt+T (only when in edit mode)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Alt+T
      if (e.altKey && e.key.toLowerCase() === 't') {
        // Don't trigger if user is typing in an input/textarea
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable
        );

        if (!isTyping && isEditMode) {
          e.preventDefault();
          toggleTemplates();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTemplates, isEditMode]);

  const value = {
    isOpen,
    isEditMode,
    viewportInfo,
    openTemplates,
    closeTemplates,
    toggleTemplates,
    setEditModeState,
    setElementCreator,
    setViewport,
    createFromTemplate,
  };

  return (
    <TemplatesNavigationContext.Provider value={value}>
      {children}
    </TemplatesNavigationContext.Provider>
  );
};
