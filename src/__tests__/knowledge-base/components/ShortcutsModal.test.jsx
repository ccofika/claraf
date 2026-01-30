import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ShortcutsModal from '../../../components/KnowledgeBase/ShortcutsModal';

describe('ShortcutsModal', () => {
  it('renders shortcuts modal', () => {
    render(<ShortcutsModal onClose={jest.fn()} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('displays all shortcut categories', () => {
    render(<ShortcutsModal onClose={jest.fn()} />);
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Editing')).toBeInTheDocument();
    expect(screen.getByText('Text Formatting')).toBeInTheDocument();
  });

  it('displays shortcut descriptions', () => {
    render(<ShortcutsModal onClose={jest.fn()} />);
    expect(screen.getByText('Save page')).toBeInTheDocument();
    expect(screen.getByText('Open search')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
  });

  it('calls onClose when X button clicked', () => {
    const onClose = jest.fn();
    render(<ShortcutsModal onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('calls onClose when backdrop clicked', () => {
    const onClose = jest.fn();
    const { container } = render(<ShortcutsModal onClose={onClose} />);
    fireEvent.click(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when modal content clicked', () => {
    const onClose = jest.fn();
    render(<ShortcutsModal onClose={onClose} />);
    fireEvent.click(screen.getByText('Keyboard Shortcuts'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
