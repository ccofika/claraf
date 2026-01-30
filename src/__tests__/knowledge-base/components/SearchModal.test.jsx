import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SearchModal from '../../../components/KnowledgeBase/search/SearchModal';

describe('SearchModal', () => {
  const defaultProps = {
    onSearch: jest.fn().mockResolvedValue([]),
    onNavigate: jest.fn(),
    recentSearches: [],
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders search input', () => {
    render(<SearchModal {...defaultProps} />);
    expect(screen.getByPlaceholderText(/search pages/i)).toBeInTheDocument();
  });

  it('focuses search input on mount', () => {
    render(<SearchModal {...defaultProps} />);
    const input = screen.getByPlaceholderText(/search pages/i);
    expect(document.activeElement).toBe(input);
  });

  it('closes on Escape key', () => {
    render(<SearchModal {...defaultProps} />);
    fireEvent.keyDown(screen.getByPlaceholderText(/search pages/i), { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes on backdrop click', () => {
    const { container } = render(<SearchModal {...defaultProps} />);
    const backdrop = container.firstChild;
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows "no results" message when search returns empty', async () => {
    render(<SearchModal {...defaultProps} />);
    const input = screen.getByPlaceholderText(/search pages/i);

    fireEvent.change(input, { target: { value: 'nonexistent' } });

    act(() => { jest.advanceTimersByTime(400); });

    await waitFor(() => {
      expect(screen.getByText(/no results/i)).toBeInTheDocument();
    });
  });

  it('displays search results', async () => {
    const mockResults = [
      { _id: '1', title: 'Test Page', slug: 'test-page', icon: '📄' }
    ];
    const onSearch = jest.fn().mockResolvedValue(mockResults);

    render(<SearchModal {...defaultProps} onSearch={onSearch} />);
    const input = screen.getByPlaceholderText(/search pages/i);
    fireEvent.change(input, { target: { value: 'test' } });

    act(() => { jest.advanceTimersByTime(400); });

    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });
  });

  it('navigates on result click', async () => {
    const mockResults = [
      { _id: '1', title: 'Test Page', slug: 'test-page', icon: '📄' }
    ];
    const onSearch = jest.fn().mockResolvedValue(mockResults);

    render(<SearchModal {...defaultProps} onSearch={onSearch} />);
    const input = screen.getByPlaceholderText(/search pages/i);
    fireEvent.change(input, { target: { value: 'test' } });

    act(() => { jest.advanceTimersByTime(400); });

    await waitFor(() => {
      fireEvent.click(screen.getByText('Test Page'));
    });

    expect(defaultProps.onNavigate).toHaveBeenCalledWith('test-page');
  });

  it('shows recent searches when query is empty', () => {
    const recentSearches = [
      { _id: '1', title: 'Recent Page', slug: 'recent' }
    ];

    render(<SearchModal {...defaultProps} recentSearches={recentSearches} />);
    expect(screen.getByText('Recent Page')).toBeInTheDocument();
  });

  it('debounces search calls', () => {
    const onSearch = jest.fn().mockResolvedValue([]);
    render(<SearchModal {...defaultProps} onSearch={onSearch} />);
    const input = screen.getByPlaceholderText(/search pages/i);

    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.change(input, { target: { value: 'abc' } });

    act(() => { jest.advanceTimersByTime(200); });
    expect(onSearch).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(200); });
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('abc');
  });

  it('shows keyboard shortcuts in footer', () => {
    render(<SearchModal {...defaultProps} />);
    expect(screen.getByText('Navigate')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});
