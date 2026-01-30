import { renderHook, act } from '@testing-library/react';
import { useKBKeyboardShortcuts, KB_SHORTCUTS } from '../../../hooks/useKBKeyboardShortcuts';

describe('useKBKeyboardShortcuts', () => {
  it('returns undo/redo functions', () => {
    const { result } = renderHook(() => useKBKeyboardShortcuts());
    expect(typeof result.current.pushToUndo).toBe('function');
    expect(typeof result.current.undo).toBe('function');
    expect(typeof result.current.redo).toBe('function');
  });

  it('calls onSave on Ctrl+S', () => {
    const onSave = jest.fn();
    renderHook(() => useKBKeyboardShortcuts({ onSave }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true
      }));
    });

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onSearch on Ctrl+K', () => {
    const onSearch = jest.fn();
    renderHook(() => useKBKeyboardShortcuts({ onSearch }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true
      }));
    });

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onEscape on Escape', () => {
    const onEscape = jest.fn();
    renderHook(() => useKBKeyboardShortcuts({ onEscape }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      }));
    });

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('calls onMoveBlockUp on Alt+ArrowUp', () => {
    const onMoveBlockUp = jest.fn();
    renderHook(() => useKBKeyboardShortcuts({ onMoveBlockUp }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        altKey: true,
        bubbles: true
      }));
    });

    expect(onMoveBlockUp).toHaveBeenCalledTimes(1);
  });

  it('calls onMoveBlockDown on Alt+ArrowDown', () => {
    const onMoveBlockDown = jest.fn();
    renderHook(() => useKBKeyboardShortcuts({ onMoveBlockDown }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        altKey: true,
        bubbles: true
      }));
    });

    expect(onMoveBlockDown).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', () => {
    const onSave = jest.fn();
    renderHook(() => useKBKeyboardShortcuts({ onSave, enabled: false }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true
      }));
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('manages undo stack correctly', () => {
    const { result } = renderHook(() => useKBKeyboardShortcuts());

    act(() => {
      result.current.pushToUndo({ blocks: [1, 2, 3] });
      result.current.pushToUndo({ blocks: [1, 2, 3, 4] });
    });

    expect(result.current.undoStackRef.current).toHaveLength(2);

    let undone;
    act(() => {
      undone = result.current.undo();
    });

    expect(undone).toEqual({ blocks: [1, 2, 3, 4] });
    expect(result.current.undoStackRef.current).toHaveLength(1);
    expect(result.current.redoStackRef.current).toHaveLength(1);
  });

  it('manages redo stack correctly', () => {
    const { result } = renderHook(() => useKBKeyboardShortcuts());

    act(() => {
      result.current.pushToUndo({ blocks: [1] });
      result.current.pushToUndo({ blocks: [2] });
    });

    act(() => {
      result.current.undo();
    });

    let redone;
    act(() => {
      redone = result.current.redo();
    });

    expect(redone).toEqual({ blocks: [2] });
  });

  it('returns null on undo when stack is empty', () => {
    const { result } = renderHook(() => useKBKeyboardShortcuts());

    let undone;
    act(() => {
      undone = result.current.undo();
    });

    expect(undone).toBeNull();
  });
});

describe('KB_SHORTCUTS', () => {
  it('has required categories', () => {
    const categories = KB_SHORTCUTS.map(c => c.category);
    expect(categories).toContain('General');
    expect(categories).toContain('Editing');
    expect(categories).toContain('Text Formatting');
  });

  it('each shortcut has required fields', () => {
    KB_SHORTCUTS.forEach(category => {
      category.shortcuts.forEach(shortcut => {
        expect(shortcut).toHaveProperty('keys');
        expect(shortcut).toHaveProperty('mac');
        expect(shortcut).toHaveProperty('description');
      });
    });
  });
});
