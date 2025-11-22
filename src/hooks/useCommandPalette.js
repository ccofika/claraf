import { useContext } from 'react';
import { CommandPaletteContext } from '../context/CommandPaletteContext';

export const useCommandPalette = () => {
  const context = useContext(CommandPaletteContext);

  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }

  return context;
};
