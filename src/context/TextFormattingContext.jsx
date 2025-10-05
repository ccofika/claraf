import React, { createContext, useState, useContext } from 'react';

const TextFormattingContext = createContext();

export const useTextFormatting = () => {
  const context = useContext(TextFormattingContext);
  if (!context) {
    throw new Error('useTextFormatting must be used within TextFormattingProvider');
  }
  return context;
};

export const TextFormattingProvider = ({ children }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentFormatting, setCurrentFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
    hyperlink: ''
  });
  const [currentFontSize, setCurrentFontSize] = useState(16);
  const [onFormattingChange, setOnFormattingChange] = useState(null);

  const startEditing = (formatting = {}, fontSize = 16, onChange = null) => {
    setIsEditing(true);
    setCurrentFormatting({
      bold: formatting?.bold || false,
      italic: formatting?.italic || false,
      underline: formatting?.underline || false,
      hyperlink: formatting?.hyperlink || ''
    });
    setCurrentFontSize(fontSize);
    setOnFormattingChange(() => onChange);
  };

  const stopEditing = () => {
    setIsEditing(false);
    setCurrentFormatting({
      bold: false,
      italic: false,
      underline: false,
      hyperlink: ''
    });
    setCurrentFontSize(16);
    setOnFormattingChange(null);
  };

  const toggleBold = () => {
    const newFormatting = { ...currentFormatting, bold: !currentFormatting.bold };
    setCurrentFormatting(newFormatting);
    onFormattingChange?.(newFormatting, currentFontSize);
  };

  const toggleItalic = () => {
    const newFormatting = { ...currentFormatting, italic: !currentFormatting.italic };
    setCurrentFormatting(newFormatting);
    onFormattingChange?.(newFormatting, currentFontSize);
  };

  const toggleUnderline = () => {
    const newFormatting = { ...currentFormatting, underline: !currentFormatting.underline };
    setCurrentFormatting(newFormatting);
    onFormattingChange?.(newFormatting, currentFontSize);
  };

  const setHyperlink = (url) => {
    const newFormatting = { ...currentFormatting, hyperlink: url };
    setCurrentFormatting(newFormatting);
    onFormattingChange?.(newFormatting, currentFontSize);
  };

  const increaseFontSize = () => {
    const newSize = Math.min(currentFontSize + 2, 72);
    setCurrentFontSize(newSize);
    onFormattingChange?.(currentFormatting, newSize);
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(currentFontSize - 2, 8);
    setCurrentFontSize(newSize);
    onFormattingChange?.(currentFormatting, newSize);
  };

  const value = {
    isEditing,
    currentFormatting,
    currentFontSize,
    startEditing,
    stopEditing,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    setHyperlink,
    increaseFontSize,
    decreaseFontSize
  };

  return (
    <TextFormattingContext.Provider value={value}>
      {children}
    </TextFormattingContext.Provider>
  );
};
